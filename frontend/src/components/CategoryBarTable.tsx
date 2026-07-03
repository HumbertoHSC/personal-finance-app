import { formatCurrency } from '../lib/format';
import type { CategoryTotal } from '../types/api';

interface CategoryBarTableProps {
  caption: string;
  categories: CategoryTotal[];
  emptyMessage: string;
}

// Tabela real (não canvas): a barra é decorativa, o valor já está no texto —
// leitor de tela e tabela acessível vêm de graça, sem precisar de um toggle separado.
export function CategoryBarTable({ caption, categories, emptyMessage }: CategoryBarTableProps) {
  if (categories.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  const max = Math.max(...categories.map((c) => Number(c.total)));

  return (
    <table className="category-bar-table">
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        <col style={{ width: '34%' }} />
        <col style={{ width: '46%' }} />
        <col style={{ width: '20%' }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Categoria</th>
          <th scope="col" aria-hidden="true"></th>
          <th scope="col" className="num">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => {
          const percent = max > 0 ? (Number(category.total) / max) * 100 : 0;
          return (
            <tr key={category.categoryId}>
              <th scope="row">{category.name}</th>
              <td aria-hidden="true">
                <div className="bar-row__track">
                  <div className="bar-row__fill" style={{ width: `${percent}%` }} />
                </div>
              </td>
              <td className="num">{formatCurrency(category.total)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
