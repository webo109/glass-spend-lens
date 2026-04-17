import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Currency, Expense, mockExpenses } from "@/lib/expenses";

export type ViewMode = 'monthly' | 'annual';

interface AppCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  expenses: Expense[];
  addExpense: (e: Expense) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('OMR');
  const [view, setView] = useState<ViewMode>('monthly');
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

  const value = useMemo(() => ({
    currency, setCurrency, view, setView, expenses,
    addExpense: (e: Expense) => setExpenses(prev => [e, ...prev]),
  }), [currency, view, expenses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be inside AppProvider");
  return c;
};
