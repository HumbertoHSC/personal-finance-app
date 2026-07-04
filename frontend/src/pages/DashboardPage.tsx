import { useEffect, useState } from 'react';
import { CategoryBarTable } from '../components/CategoryBarTable';
import { StatTile } from '../components/StatTile';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../lib/format-error';
import { currentMonth, formatCurrency } from '../lib/format';
import { dashboardApi } from '../services/dashboard';
import { demoDashboardApi } from '../services/demo';
import type { CategoryTotal, DashboardSummary } from '../types/api';

export function DashboardPage() {
  const { user } = useAuth();
  const service = user ? dashboardApi : demoDashboardApi;

  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([service.summary(month), service.byCategory(month)])
      .then(([summaryData, byCategoryData]) => {
        setSummary(summaryData);
        setCategories(byCategoryData.categories);
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [month, user]);

  const balance = summary ? Number(summary.balance) : 0;
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo do mês selecionado.</p>
        </div>
        <div className="month-picker">
          <label htmlFor="dashboard-month">Mês</label>
          <input
            id="dashboard-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Carregando…</div>
      ) : !summary ? null : (
        <>
          <div className="kpi-row">
            <StatTile label="Receitas" value={formatCurrency(summary.income)} />
            <StatTile label="Despesas" value={formatCurrency(summary.expense)} />
            <StatTile
              label="Saldo"
              value={formatCurrency(summary.balance)}
              status={balance >= 0 ? 'good' : 'critical'}
              statusLabel={balance >= 0 ? 'Positivo' : 'Negativo'}
            />
          </div>

          <div className="card">
            <h2>Despesas por categoria</h2>
            <CategoryBarTable
              caption={`Despesas por categoria em ${month}`}
              categories={expenseCategories}
              emptyMessage="Nenhuma despesa registrada neste mês."
            />
          </div>

          <div className="card">
            <h2>Receitas por categoria</h2>
            <CategoryBarTable
              caption={`Receitas por categoria em ${month}`}
              categories={incomeCategories}
              emptyMessage="Nenhuma receita registrada neste mês."
            />
          </div>
        </>
      )}
    </div>
  );
}
