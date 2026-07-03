import type { EntryType } from '../types/api';

export function EntryTypeBadge({ type }: { type: EntryType }) {
  return (
    <span className={type === 'INCOME' ? 'badge badge-income' : 'badge badge-expense'}>
      {type === 'INCOME' ? 'Receita' : 'Despesa'}
    </span>
  );
}
