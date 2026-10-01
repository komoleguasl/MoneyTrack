import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import {
    useExpenses
} from '../../context/ExpenseContext';
import {
    getNbuRate,
    NbuRate,
} from '../../services/nbu';

export default function HomeScreen() {
  const {
    expenses,
    isLoading,
    currency,
  } = useExpenses();

  const [usdRate, setUsdRate] =
    useState<NbuRate | null>(null);

  const [eurRate, setEurRate] =
    useState<NbuRate | null>(null);

  const [isLoadingRate, setIsLoadingRate] =
    useState(false);

  useEffect(() => {
    const loadRate = async () => {
      if (currency === 'UAH') {
        return;
      }

      try {
        setIsLoadingRate(true);

        if (
          currency === 'USD' &&
          !usdRate
        ) {
          const result =
            await getNbuRate('USD');

          setUsdRate(result);
        }

        if (
          currency === 'EUR' &&
          !eurRate
        ) {
          const result =
            await getNbuRate('EUR');

          setEurRate(result);
        }
      } catch (error) {
        console.error(
          'Помилка отримання курсу:',
          error,
        );

        Alert.alert(
          'Помилка',
          'Не вдалося отримати курс НБУ.',
        );
      } finally {
        setIsLoadingRate(false);
      }
    };

    loadRate();
  }, [
    currency,
    usdRate,
    eurRate,
  ]);

  const getRate = (
    currencyCode: string,
  ) => {
    if (currencyCode === 'USD') {
      return usdRate?.rate ?? null;
    }

    if (currencyCode === 'EUR') {
      return eurRate?.rate ?? null;
    }

    return null;
  };

  const convertToSelectedCurrency = (
    amount: number,
    fromCurrency: string,
  ) => {
    if (
      fromCurrency === currency
    ) {
      return amount;
    }

    const sourceRate =
      getRate(fromCurrency);

    const targetRate =
      getRate(currency);

    // USD/EUR → UAH
    if (currency === 'UAH') {
      if (!sourceRate) {
        return null;
      }

      return amount * sourceRate;
    }

    // UAH → USD/EUR
    if (fromCurrency === 'UAH') {
      if (!targetRate) {
        return null;
      }

      return amount / targetRate;
    }

    // USD ↔ EUR
    if (
      sourceRate &&
      targetRate
    ) {
      return (
        (amount * sourceRate) /
        targetRate
      );
    }

    return null;
  };

  const currentMonthExpenses =
    useMemo(() => {
      const now = new Date();

      return expenses.filter(
        (expense) => {
          const date = new Date(
            expense.date,
          );

          return (
            date.getMonth() ===
              now.getMonth() &&
            date.getFullYear() ===
              now.getFullYear()
          );
        },
      );
    }, [expenses]);

  const convertedExpenses =
    useMemo(() => {
      return currentMonthExpenses
        .map((expense) => {
          const converted =
            convertToSelectedCurrency(
              expense.amount,
              expense.currency,
            );

          if (converted === null) {
            return null;
          }

          return {
            ...expense,
            convertedAmount:
              converted,
          };
        })
        .filter(
          (
            expense,
          ): expense is NonNullable<
            typeof expense
          > => expense !== null,
        );
    }, [
      currentMonthExpenses,
      currency,
      usdRate,
      eurRate,
    ]);

  const monthlyTotal = useMemo(() => {
    return convertedExpenses.reduce(
      (total, expense) =>
        total +
        expense.convertedAmount,
      0,
    );
  }, [convertedExpenses]);

  const currencySymbol =
    currency === 'UAH'
      ? '₴'
      : currency;

  const formattedTotal =
    monthlyTotal.toLocaleString(
      'uk-UA',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    );

  const monthlyExpenseCount =
    currentMonthExpenses.length;

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInUp.duration(500)}
        style={styles.header}
      >
        <View>
          <Text style={styles.greeting}>
            Вітаємо 👋
          </Text>

          <Text style={styles.title}>
            MoneyTrack
          </Text>

          <Text style={styles.subtitle}>
            Контролюйте свої витрати
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons
            name="wallet-outline"
            size={28}
            color="#2563EB"
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          150,
        ).duration(500)}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>
          Витрати за цей місяць
        </Text>

        {isLoading ||
        isLoadingRate ? (
          <View
            style={styles.loadingContainer}
          >
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text
              style={styles.loadingText}
            >
              {isLoading
                ? 'Завантаження...'
                : 'Отримання курсу НБУ...'}
            </Text>
          </View>
        ) : (
          <Text
            style={styles.balanceAmount}
          >
            {formattedTotal}{' '}
            {currencySymbol}
          </Text>
        )}

        <View
          style={styles.balanceFooter}
        >
          <Ionicons
            name={
              monthlyTotal > 0
                ? 'trending-down-outline'
                : 'wallet-outline'
            }
            size={18}
            color="#DBEAFE"
          />

          <Text
            style={
              styles.balanceFooterText
            }
          >
            {monthlyTotal > 0
              ? `Витрат: ${monthlyExpenseCount}`
              : 'Поки що витрат немає'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          300,
        ).duration(500)}
        style={styles.actionsCard}
      >
        <Text style={styles.sectionTitle}>
          Швидка дія
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed &&
              styles.addButtonPressed,
          ]}
          onPress={() =>
            router.push('/add-expense')
          }
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.addTextContainer
            }
          >
            <Text style={styles.addTitle}>
              Додати витрату
            </Text>

            <Text
              style={styles.addSubtitle}
            >
              Записати нову покупку або
              платіж
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#94A3B8"
          />
        </Pressable>
      </Animated.View>

      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color="#CBD5E1"
          />

          <Text
            style={styles.emptyTitle}
          >
            Витрат ще немає
          </Text>

          <Text
            style={styles.emptyText}
          >
            Додайте першу витрату, щоб
            почати відстежувати свої
            фінанси.
          </Text>
        </View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(
            450,
          ).duration(500)}
          style={styles.savedState}
        >
          <Ionicons
            name="checkmark-circle"
            size={42}
            color="#22C55E"
          />

          <Text
            style={styles.savedTitle}
          >
            Дані збережено
          </Text>

          <Text style={styles.savedText}>
            Усього записів: {expenses.length}
          </Text>

          <Text
            style={styles.currencyInfo}
          >
            Валюта: {currency}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  title: {
    marginTop: 3,
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
  },
  balanceCard: {
    marginTop: 28,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#2563EB',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DBEAFE',
  },
  balanceAmount: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#DBEAFE',
  },
  balanceFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceFooterText: {
    marginLeft: 7,
    fontSize: 13,
    color: '#DBEAFE',
  },
  actionsCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  addButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  addTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  addSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 70,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
    color: '#94A3B8',
  },
  savedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 70,
  },
  savedTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  savedText: {
    marginTop: 5,
    fontSize: 14,
    color: '#64748B',
  },
  currencyInfo: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});