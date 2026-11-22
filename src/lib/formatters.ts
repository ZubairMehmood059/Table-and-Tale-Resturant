export function formatCurrency(amount: number): string {
  const validAmount = Number.isFinite(amount) ? amount : 0;
  return `Rs. ${validAmount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatWholeCurrency(amount: number): string {
  const validAmount = Number.isFinite(amount) ? amount : 0;
  return `Rs. ${validAmount.toLocaleString('en-PK')}`;
}
