import { useEffect, useState, type FormEvent } from 'react';
import { EntryTypeBadge } from '../components/EntryTypeBadge';
import { useAuth } from '../hooks/useAuth';
import { formatApiError } from '../lib/format-error';
import { categoriesApi } from '../services/categories';
import { demoCategoriesApi } from '../services/demo';
import type { Category, EntryType } from '../types/api';

export function CategoriesPage() {
  const { user } = useAuth();
  const categoryService = user ? categoriesApi : demoCategoriesApi;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<EntryType>('EXPENSE');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [rowError, setRowError] = useState<string | null>(null);

  function loadCategories() {
    setLoading(true);
    categoryService
      .list()
      .then(setCategories)
      .catch((err) => setListError(formatApiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(loadCategories, [categoryService]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const created = await categoryService.create({ name, type });
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setRowError(null);
  }

  async function handleRename(id: string) {
    setRowError(null);
    try {
      const updated = await categoryService.update(id, { name: editingName });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    } catch (err) {
      setRowError(formatApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta categoria?')) return;
    setRowError(null);
    try {
      await categoryService.remove(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setRowError(formatApiError(err));
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Categorias</h1>
          <p>Organize suas receitas e despesas por categoria.</p>
        </div>
      </div>

      <div className="card">
        <form className="row" onSubmit={handleCreate}>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="cat-name">Nova categoria</label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Alimentação"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="cat-type">Tipo</label>
            <select id="cat-type" value={type} onChange={(e) => setType(e.target.value as EntryType)}>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Adicionar'}
          </button>
        </form>
        {formError && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {formError}
          </div>
        )}
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
        ) : categories.length === 0 ? (
          <div className="empty-state">Nenhuma categoria cadastrada ainda.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {editingId === category.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td>
                    <EntryTypeBadge type={category.type} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {editingId === category.id ? (
                      <>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => handleRename(category.id)}
                        >
                          Salvar
                        </button>{' '}
                        <button type="button" className="btn-link" onClick={() => setEditingId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn-link" onClick={() => startEdit(category)}>
                          Renomear
                        </button>{' '}
                        <button
                          type="button"
                          className="btn-link"
                          style={{ color: 'var(--status-critical-text)' }}
                          onClick={() => handleDelete(category.id)}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
