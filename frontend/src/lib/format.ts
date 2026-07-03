const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

export function formatCurrency(amount: string): string {
  return currencyFormatter.format(Number(amount));
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function todayAsDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
