export type Money = { cents: bigint; currency: 'USD' | 'USDC' };

export const toCents = (n: number): bigint => BigInt(Math.round(n * 100));

export const add = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return { cents: a.cents + b.cents, currency: a.currency };
};

export const subtract = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return { cents: a.cents - b.cents, currency: a.currency };
};

export const multiply = (money: Money, factor: number): Money => {
  return { cents: money.cents * BigInt(Math.round(factor * 100)) / BigInt(100), currency: money.currency };
};

export const formatUSD = (cents: bigint): string => (Number(cents) / 100).toFixed(2);

export const formatMoney = (money: Money): string => {
  const amount = formatUSD(money.cents);
  return money.currency === 'USDC' ? `${amount} USDC` : `$${amount}`;
};

export const fromDollars = (amount: number, currency: 'USD' | 'USDC' = 'USD'): Money => ({
  cents: toCents(amount),
  currency
});

export const toDollars = (money: Money): number => Number(money.cents) / 100;

export const isPositive = (money: Money): boolean => money.cents > BigInt(0);

export const isNegative = (money: Money): boolean => money.cents < BigInt(0);

export const isZero = (money: Money): boolean => money.cents === BigInt(0);

export const compare = (a: Money, b: Money): number => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  if (a.cents > b.cents) return 1;
  if (a.cents < b.cents) return -1;
  return 0;
};