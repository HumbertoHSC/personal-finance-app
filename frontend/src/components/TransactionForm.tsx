import { useEffect, useState, type FormEvent } from 'react';
import { formatApiError } from '../lib/format-error';
import { todayAsDateInput } from '../lib/format';
import type { TransactionInput } from '../services/transactions';
import type { Category, EntryType, Transaction } from '../types/api';

interface TransactionFormProps {
  categories: Category[];
  editing: Transaction | null;
  onSubmit: (payload: TransactionInput) => Promise<void>;
  onCancelEdit: () => void;
}

const emptyForm = {
  description: '',
  amount: '',
  type: 'EXPENSE' as EntryType,
  date: todayAsDateInput(),
  categoryId: '',
};

export function TransactionForm({ categories, editing, onSubmit, onCancelEdit }: TransactionFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        description: editing.description,
        amount: editing.amount,
        type: editing.type,
        date: editing.date.slice(0, 10),
        categoryId: editing.categoryId,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [editing]);

  const categoriesForType = categories.filter((c) => c.type === form.type);

  function handleTypeChange(type: EntryType) {
    setForm((prev) => ({
      ...prev,
      type,
      categoryId: categories.find((c) => c.id === prev.categoryId && c.type === type)
        ? prev.categoryId
        : '',
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.categoryId) {
      setError('Selecione uma categoria.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      if (!editing) setForm(emptyForm);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="row">
        <div className="field" style={{ flex: 2, minWidth: 200 }}>
          <label htmlFor="tx-description">Descrição</label>
          <input
            id="tx-description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tx-amount">Valor</label>
          <input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tx-date">Data</label>
          <input
            id="tx-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="tx-type">Tipo</label>
          <select
            id="tx-type"
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value as EntryType)}
          >
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label htmlFor="tx-category">Categoria</label>
          <select
            id="tx-category"
            value={form.categoryId}
            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            required
          >
            <option value="" disabled>
              {categoriesForType.length === 0 ? 'Nenhuma categoria deste tipo' : 'Selecione…'}
            </option>
            {categoriesForType.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar transação'}
        </button>
        {editing && (
          <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
    </form>
  );
}
