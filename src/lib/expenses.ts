export type ExpenseType = 'subscription' | 'one_time' | 'scenario';
export type Currency = 'OMR' | 'USD';
export type Status = 'active' | 'paused' | 'cancelled';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual' | 'one_time';

export interface Expense {
  id: string;
  name: string;
  vendor?: string;
  category: string;
  type: ExpenseType;
  currency: Currency;
  base_rate: number;
  quantity: number;
  total_amount: number; // base_rate * quantity (pre-VAT)
  vat_amount: number;   // 5% of total_amount
  includes_vat: boolean;
  billing_cycle: BillingCycle;
  status: Status;
  next_renewal: string; // ISO
}

// FX (illustrative): 1 OMR = 2.6 USD
export const FX = { OMR_TO_USD: 2.6, USD_TO_OMR: 1 / 2.6 };

export const convert = (amount: number, from: Currency, to: Currency) => {
  if (from === to) return amount;
  return from === 'OMR' ? amount * FX.OMR_TO_USD : amount * FX.USD_TO_OMR;
};

export const formatMoney = (amount: number, currency: Currency) => {
  const symbol = currency === 'OMR' ? 'OMR' : 'USD';
  const value = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol} ${value}`;
};

const today = new Date();
const addDays = (d: number) => new Date(today.getTime() + d * 86400000).toISOString();

const make = (e: Omit<Expense, 'total_amount' | 'vat_amount'>): Expense => {
  const total = e.base_rate * e.quantity;
  return { ...e, total_amount: total, vat_amount: +(total * 0.05).toFixed(2) };
};

export const mockExpenses: Expense[] = [
  make({ id: 'e1', name: 'AWS Production Cluster', vendor: 'Amazon Web Services', category: 'Infrastructure',
    type: 'subscription', currency: 'USD', base_rate: 1850, quantity: 1, includes_vat: false,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(8) }),
  make({ id: 'e2', name: 'Mobile Lines — Sales Team', vendor: 'Omantel', category: 'Telecom',
    type: 'subscription', currency: 'OMR', base_rate: 12, quantity: 14, includes_vat: true,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(3) }),
  make({ id: 'e3', name: 'Figma Organization', vendor: 'Figma', category: 'Design',
    type: 'subscription', currency: 'USD', base_rate: 45, quantity: 22, includes_vat: false,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(21) }),
  make({ id: 'e4', name: 'Office Lease — Muscat HQ', vendor: 'Tilal Properties', category: 'Real Estate',
    type: 'subscription', currency: 'OMR', base_rate: 2400, quantity: 1, includes_vat: true,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(12) }),
  make({ id: 'e5', name: 'Linear Business', vendor: 'Linear', category: 'Productivity',
    type: 'subscription', currency: 'USD', base_rate: 16, quantity: 28, includes_vat: false,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(2) }),
  make({ id: 'e6', name: 'MacBook Pro M4 Max', vendor: 'iSAM', category: 'Hardware',
    type: 'one_time', currency: 'OMR', base_rate: 1480, quantity: 3, includes_vat: true,
    billing_cycle: 'one_time', status: 'active', next_renewal: addDays(0) }),
  make({ id: 'e7', name: 'Vercel Enterprise', vendor: 'Vercel', category: 'Infrastructure',
    type: 'subscription', currency: 'USD', base_rate: 2400, quantity: 1, includes_vat: false,
    billing_cycle: 'annual', status: 'active', next_renewal: addDays(64) }),
  make({ id: 'e8', name: 'Notion Plus', vendor: 'Notion', category: 'Productivity',
    type: 'subscription', currency: 'USD', base_rate: 10, quantity: 32, includes_vat: false,
    billing_cycle: 'monthly', status: 'paused', next_renewal: addDays(28) }),
  make({ id: 'e9', name: 'OpenAI API — Production', vendor: 'OpenAI', category: 'AI / API',
    type: 'subscription', currency: 'USD', base_rate: 720, quantity: 1, includes_vat: false,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(15) }),
  make({ id: 'e10', name: 'Salesforce Starter', vendor: 'Salesforce', category: 'CRM',
    type: 'subscription', currency: 'USD', base_rate: 25, quantity: 18, includes_vat: false,
    billing_cycle: 'monthly', status: 'cancelled', next_renewal: addDays(-4) }),
  make({ id: 'e11', name: 'Quarterly VAT Filing — PwC', vendor: 'PwC Oman', category: 'Professional',
    type: 'subscription', currency: 'OMR', base_rate: 850, quantity: 1, includes_vat: true,
    billing_cycle: 'quarterly', status: 'active', next_renewal: addDays(40) }),
  make({ id: 'e12', name: 'Slack Business+', vendor: 'Slack', category: 'Communication',
    type: 'subscription', currency: 'USD', base_rate: 12.5, quantity: 30, includes_vat: false,
    billing_cycle: 'monthly', status: 'active', next_renewal: addDays(6) }),
];

// Normalize to a monthly figure in target currency (pre + VAT)
export const monthlyInCurrency = (e: Expense, target: Currency): number => {
  const baseTotal = e.total_amount + e.vat_amount;
  const inTarget = convert(baseTotal, e.currency, target);
  switch (e.billing_cycle) {
    case 'monthly': return inTarget;
    case 'quarterly': return inTarget / 3;
    case 'annual': return inTarget / 12;
    case 'one_time': return 0;
    default: return 0;
  }
};

export const totalsFor = (list: Expense[], currency: Currency) => {
  const active = list.filter(e => e.status === 'active');
  const monthly = active.reduce((s, e) => s + monthlyInCurrency(e, currency), 0);
  const annual = monthly * 12;
  const vat = active.reduce((s, e) => {
    const v = convert(e.vat_amount, e.currency, currency);
    if (e.billing_cycle === 'monthly') return s + v;
    if (e.billing_cycle === 'quarterly') return s + v / 3;
    if (e.billing_cycle === 'annual') return s + v / 12;
    return s;
  }, 0);
  return { monthly, annual, vat };
};
