export type Expense = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
  currency: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  icon: string;
};

export type CategoryLimit = {
  categoryId: string;
  limit: number;
};
