import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CategoryLimit,
  Expense,
} from '../types/expense';

const STORAGE_KEY = '@moneytrack_expenses';
const LIMITS_STORAGE_KEY =
  '@moneytrack_category_limits';
const CURRENCY_STORAGE_KEY =
  '@moneytrack_currency';

export type AppCurrency =
  | 'UAH'
  | 'USD'
  | 'EUR';

type ExpenseContextValue = {
  expenses: Expense[];
  categoryLimits: CategoryLimit[];
  currency: AppCurrency;
  isLoading: boolean;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (
    expense: Expense,
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  clearExpenses: () => Promise<void>;
  setCategoryLimit: (
    categoryId: string,
    limit: number,
  ) => Promise<void>;
  removeCategoryLimit: (
    categoryId: string,
  ) => Promise<void>;
  getCategorySpent: (
    categoryId: string,
  ) => number;
  setCurrency: (
    currency: AppCurrency,
  ) => Promise<void>;
};

const ExpenseContext =
  createContext<ExpenseContextValue | undefined>(
    undefined,
  );

export function ExpenseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [categoryLimits, setCategoryLimits] =
    useState<CategoryLimit[]>([]);

  const [currency, setCurrencyState] =
    useState<AppCurrency>('UAH');

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          storedExpenses,
          storedLimits,
          storedCurrency,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(
            LIMITS_STORAGE_KEY,
          ),
          AsyncStorage.getItem(
            CURRENCY_STORAGE_KEY,
          ),
        ]);

        if (storedExpenses) {
          setExpenses(
            JSON.parse(storedExpenses),
          );
        }

        if (storedLimits) {
          setCategoryLimits(
            JSON.parse(storedLimits),
          );
        }

        if (
          storedCurrency === 'UAH' ||
          storedCurrency === 'USD' ||
          storedCurrency === 'EUR'
        ) {
          setCurrencyState(storedCurrency);
        }
      } catch (error) {
        console.error(
          'Не вдалося завантажити дані:',
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveExpenses = useCallback(
    async (nextExpenses: Expense[]) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextExpenses),
        );
      } catch (error) {
        console.error(
          'Не вдалося зберегти витрати:',
          error,
        );
        throw error;
      }
    },
    [],
  );

  const saveLimits = useCallback(
    async (nextLimits: CategoryLimit[]) => {
      try {
        await AsyncStorage.setItem(
          LIMITS_STORAGE_KEY,
          JSON.stringify(nextLimits),
        );
      } catch (error) {
        console.error(
          'Не вдалося зберегти ліміти:',
          error,
        );
        throw error;
      }
    },
    [],
  );

  const addExpense = useCallback(
    async (expense: Expense) => {
      const nextExpenses = [
        expense,
        ...expenses,
      ];

      setExpenses(nextExpenses);

      await saveExpenses(nextExpenses);
    },
    [expenses, saveExpenses],
  );

  const updateExpense = useCallback(
    async (updatedExpense: Expense) => {
      const nextExpenses = expenses.map(
        (expense) =>
          expense.id === updatedExpense.id
            ? updatedExpense
            : expense,
      );

      setExpenses(nextExpenses);

      await saveExpenses(nextExpenses);
    },
    [expenses, saveExpenses],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const nextExpenses =
        expenses.filter(
          (expense) => expense.id !== id,
        );

      setExpenses(nextExpenses);

      await saveExpenses(nextExpenses);
    },
    [expenses, saveExpenses],
  );

  const clearExpenses = useCallback(
    async () => {
      setExpenses([]);

      await AsyncStorage.removeItem(
        STORAGE_KEY,
      );
    },
    [],
  );

  const setCategoryLimit = useCallback(
    async (
      categoryId: string,
      limit: number,
    ) => {
      const existingLimit =
        categoryLimits.find(
          (item) =>
            item.categoryId === categoryId,
        );

      let nextLimits: CategoryLimit[];

      if (existingLimit) {
        nextLimits = categoryLimits.map(
          (item) =>
            item.categoryId === categoryId
              ? {
                  ...item,
                  limit,
                }
              : item,
        );
      } else {
        nextLimits = [
          ...categoryLimits,
          {
            categoryId,
            limit,
          },
        ];
      }

      setCategoryLimits(nextLimits);

      await saveLimits(nextLimits);
    },
    [categoryLimits, saveLimits],
  );

  const removeCategoryLimit = useCallback(
    async (categoryId: string) => {
      const nextLimits =
        categoryLimits.filter(
          (item) =>
            item.categoryId !== categoryId,
        );

      setCategoryLimits(nextLimits);

      await saveLimits(nextLimits);
    },
    [categoryLimits, saveLimits],
  );

  const getCategorySpent = useCallback(
    (categoryId: string) => {
      const now = new Date();

      return expenses
        .filter((expense) => {
          const date = new Date(
            expense.date,
          );

          return (
            expense.categoryId ===
              categoryId &&
            expense.currency === 'UAH' &&
            date.getMonth() ===
              now.getMonth() &&
            date.getFullYear() ===
              now.getFullYear()
          );
        })
        .reduce(
          (total, expense) =>
            total + expense.amount,
          0,
        );
    },
    [expenses],
  );

  const setCurrency = useCallback(
    async (newCurrency: AppCurrency) => {
      setCurrencyState(newCurrency);

      await AsyncStorage.setItem(
        CURRENCY_STORAGE_KEY,
        newCurrency,
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      expenses,
      categoryLimits,
      currency,
      isLoading,
      addExpense,
      updateExpense,
      deleteExpense,
      clearExpenses,
      setCategoryLimit,
      removeCategoryLimit,
      getCategorySpent,
      setCurrency,
    }),
    [
      expenses,
      categoryLimits,
      currency,
      isLoading,
      addExpense,
      updateExpense,
      deleteExpense,
      clearExpenses,
      setCategoryLimit,
      removeCategoryLimit,
      getCategorySpent,
      setCurrency,
    ],
  );

  return (
    <ExpenseContext.Provider
      value={value}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context =
    useContext(ExpenseContext);

  if (!context) {
    throw new Error(
      'useExpenses повинен використовуватися всередині ExpenseProvider',
    );
  }

  return context;
}