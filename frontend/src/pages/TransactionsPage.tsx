import { useEffect, useState } from 'react';
import { EntryTypeBadge } from '../components/EntryTypeBadge';
import { TransactionForm } from '../components/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../lib/format-error';
import { formatCurrency, formatDate } from '../lib/format';
import { categoriesApi } from '../services/categories';
import { transactionsApi, type TransactionInput } from '../services/transactions';
import { demoCategoriesApi, demoTransactionsApi } from '../services/demo';
import type { ApiMeta } from '../services/api';
import type { Category, EntryType, Transaction, TransactionFilters } from '../types/api';

const PER_PAGE = 10;

export function TransactionsPage() {
  const { user } = useAuth();
  const categoryService = user ? categoriesApi : demoCategoriesApi;
  const transactionService = user ? transactionsApi : demoTransactionsApi;

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{ type: EntryType | ''; category: string; from: string; to: string }>({
    type: '',
    category: '',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Transaction | null>(null);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => undefined);
  }, [user]);

  function loadTransactions() {
    setLoading(true);
    setListError(null);
    const query: TransactionFilters = {
      page,
      per_page: PER_PAGE,
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
    };
    transactionService
      .list(query)
      .then(({ items, meta }) => {
        setTransactions(items);
        setMeta(meta);
      })
      .catch((err) => setListError(formatApiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(loadTransactions, [filters, page, user]);

  function updateFilter<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function handleSubmit(payload: TransactionInput) {
    if (editing) {
      await transactionService.update(editing.id, payload);
      setEditing(null);
    } else {
      await transactionService.create(payload);
    }
    loadTransactions();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta transação?')) return;
    setRowError(null);
    try {
      await transactionService.remove(id);
      if (editing?.id === id) setEditing(null);
      loadTransactions();
    } catch (err) {
      setRowError(formatApiError(err));
    }
  }

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.per_page)) : 1;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Transações</h1>
          <p>Lance receitas e despesas e acompanhe o histórico.</p>
        </div>
      </div>

      <div className="card">
        <h2>{editing ? 'Editar transação' : 'Nova transação'}</h2>
        <TransactionForm
          categories={categories}
          editing={editing}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />
      </div>

      <div className="card">
        <div className="row">
          <div className="field">
            <label htmlFor="filter-type">Tipo</label>
            <select
              id="filter-type"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value as EntryType | '')}
            >
              <option value="">Todos</option>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-category">Categoria</label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-from">De</label>
            <input
              id="filter-from"
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-to">Até</label>
            <input
              id="filter-to"
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {rowError && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            {rowError}
          </div>
        )}
        {loading ? (
          <div className="empty-state">Carregando…</div>
        ) : listError ? (
          <div className="alert alert-error">{listError}</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">Nenhuma transação encontrada para esse filtro.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th className="num">Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.category.name}</td>
                    <td>
                      <EntryTypeBadge type={transaction.type} />
                    </td>
                    <td className="num">{formatCurrency(transaction.amount)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="btn-link" onClick={() => setEditing(transaction)}>
                        Editar
                      </button>{' '}
                      <button
                        type="button"
                        className="btn-link"
                        style={{ color: 'var(--status-critical-text)' }}
                        onClick={() => handleDelete(transaction.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
