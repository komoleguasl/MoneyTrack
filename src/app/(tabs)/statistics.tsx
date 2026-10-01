import { Ionicons } from '@expo/vector-icons';
import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { CATEGORIES } from '../../constants/categories';
import {
    AppCurrency,
    useExpenses,
} from '../../context/ExpenseContext';
import {
    getNbuRate,
    NbuRate,
} from '../../services/nbu';

type Period = 'week' | 'month';

export default function StatisticsScreen() {
  const {
    expenses,
    currency,
    setCurrency,
  } = useExpenses();

  const [period, setPeriod] =
    useState<Period>('month');

  const [usdRate, setUsdRate] =
    useState<NbuRate | null>(null);

  const [eurRate, setEurRate] =
    useState<NbuRate | null>(null);

  const [isLoadingRates, setIsLoadingRates] =
    useState(false);

  useEffect(() => {
    const loadRates = async () => {
      if (currency === 'UAH') {
        setIsLoadingRates(false);
        return;
      }

      try {
        setIsLoadingRates(true);

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
          'Не вдалося завантажити курс НБУ:',
          error,
        );

        Alert.alert(
          'Помилка',
          'Не вдалося отримати курс НБУ. Перевірте підключення до інтернету.',
        );
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadRates();
  }, [
    currency,
    usdRate,
    eurRate,
  ]);

  const now = new Date();

  const periodExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const date = new Date(
        expense.date,
      );

      if (period === 'month') {
        return (
          date.getMonth() ===
            now.getMonth() &&
          date.getFullYear() ===
            now.getFullYear()
        );
      }

      const currentDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const dayOfWeek =
        currentDay.getDay();

      const daysFromMonday =
        dayOfWeek === 0
          ? 6
          : dayOfWeek - 1;

      const startOfWeek = new Date(
        currentDay,
      );

      startOfWeek.setDate(
        currentDay.getDate() -
          daysFromMonday,
      );

      startOfWeek.setHours(
        0,
        0,
        0,
        0,
      );

      const endOfWeek = new Date(
        startOfWeek,
      );

      endOfWeek.setDate(
        startOfWeek.getDate() + 7,
      );

      return (
        date >= startOfWeek &&
        date < endOfWeek
      );
    });
  }, [
    expenses,
    period,
    now,
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

    const targetRate =
      getRate(currency);

    const sourceRate =
      getRate(fromCurrency);

    if (currency === 'UAH') {
      if (!sourceRate) {
        return null;
      }

      return amount * sourceRate;
    }

    if (fromCurrency === 'UAH') {
      if (!targetRate) {
        return null;
      }

      return amount / targetRate;
    }

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

  const convertedExpenses =
    useMemo(() => {
      return periodExpenses
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
      periodExpenses,
      currency,
      usdRate,
      eurRate,
    ]);

  const total = useMemo(() => {
    return convertedExpenses.reduce(
      (sum, expense) =>
        sum + expense.convertedAmount,
      0,
    );
  }, [convertedExpenses]);

  const categoryStats =
    useMemo(() => {
      return CATEGORIES.map(
        (category) => {
          const amount =
            convertedExpenses
              .filter(
                (expense) =>
                  expense.categoryId ===
                  category.id,
              )
              .reduce(
                (sum, expense) =>
                  sum +
                  expense.convertedAmount,
                0,
              );

          return {
            ...category,
            amount,
          };
        },
      )
        .filter(
          (category) =>
            category.amount > 0,
        )
        .sort(
          (a, b) =>
            b.amount - a.amount,
        );
    }, [convertedExpenses]);

  const maxCategoryAmount =
    categoryStats.length > 0
      ? Math.max(
          ...categoryStats.map(
            (item) => item.amount,
          ),
        )
      : 1;

  const averageExpense =
    convertedExpenses.length > 0
      ? total /
        convertedExpenses.length
      : 0;

  const formatAmount = (
    amount: number,
  ) =>
    amount.toLocaleString('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const currencySymbol =
    currency === 'UAH'
      ? '₴'
      : currency;

  const handleCurrencyChange =
    async (
      newCurrency: AppCurrency,
    ) => {
      await setCurrency(
        newCurrency,
      );
    };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Animated.View
        entering={FadeInUp.duration(
          500,
        )}
        style={styles.header}
      >
        <View>
          <Text style={styles.title}>
            Статистика
          </Text>

          <Text style={styles.subtitle}>
            Аналіз ваших витрат
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="stats-chart-outline"
            size={25}
            color="#2563EB"
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          100,
        ).duration(450)}
        style={styles.periodContainer}
      >
        <Pressable
          style={[
            styles.periodButton,
            period === 'week' &&
              styles.periodButtonActive,
          ]}
          onPress={() =>
            setPeriod('week')
          }
        >
          <Text
            style={[
              styles.periodText,
              period === 'week' &&
                styles.periodTextActive,
            ]}
          >
            Тиждень
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.periodButton,
            period === 'month' &&
              styles.periodButtonActive,
          ]}
          onPress={() =>
            setPeriod('month')
          }
        >
          <Text
            style={[
              styles.periodText,
              period === 'month' &&
                styles.periodTextActive,
            ]}
          >
            Місяць
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          170,
        ).duration(450)}
        style={styles.currencyCard}
      >
        <Text style={styles.currencyTitle}>
          Валюта статистики
        </Text>

        <Text
          style={styles.currencyDescription}
        >
          Перерахунок за курсом НБУ
        </Text>

        <View
          style={styles.currencyButtons}
        >
          {(
            ['UAH', 'USD', 'EUR'] as AppCurrency[]
          ).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.currencyButton,
                currency === item &&
                  styles.currencyButtonActive,
              ]}
              onPress={() =>
                handleCurrencyChange(
                  item,
                )
              }
            >
              <Text
                style={[
                  styles.currencyButtonText,
                  currency === item &&
                    styles.currencyButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          240,
        ).duration(450)}
        style={styles.totalCard}
      >
        <View style={styles.totalIcon}>
          <Ionicons
            name="wallet-outline"
            size={25}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>
            Витрати за{' '}
            {period === 'week'
              ? 'тиждень'
              : 'місяць'}
          </Text>

          {isLoadingRates ? (
            <View
              style={styles.rateLoading}
            >
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.rateLoadingText
                }
              >
                Отримання курсу...
              </Text>
            </View>
          ) : (
            <Text
              style={styles.totalAmount}
            >
              {formatAmount(total)}{' '}
              {currencySymbol}
            </Text>
          )}
        </View>
      </Animated.View>

      <View style={styles.quickStats}>
        <Animated.View
          entering={FadeInDown.delay(
            300,
          ).duration(450)}
          style={styles.smallCard}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color="#2563EB"
          />

          <Text
            style={styles.smallValue}
          >
            {periodExpenses.length}
          </Text>

          <Text
            style={styles.smallLabel}
          >
            Витрат
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(
            350,
          ).duration(450)}
          style={styles.smallCard}
        >
          <Ionicons
            name="calculator-outline"
            size={22}
            color="#2563EB"
          />

          <Text
            style={styles.smallValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatAmount(
              averageExpense,
            )}{' '}
            {currencySymbol}
          </Text>

          <Text
            style={styles.smallLabel}
          >
            Середня витрата
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(
          400,
        ).duration(450)}
        style={styles.chartCard}
      >
        <Text style={styles.sectionTitle}>
          Витрати за категоріями
        </Text>

        {categoryStats.length ===
        0 ? (
          <View
            style={styles.emptyChart}
          >
            <Ionicons
              name="bar-chart-outline"
              size={42}
              color="#CBD5E1"
            />

            <Text
              style={
                styles.emptyChartTitle
              }
            >
              Недостатньо даних
            </Text>

            <Text
              style={
                styles.emptyChartText
              }
            >
              Додайте витрати, щоб
              побачити статистику.
            </Text>
          </View>
        ) : (
          categoryStats.map(
            (category, index) => {
              const width =
                (category.amount /
                  maxCategoryAmount) *
                100;

              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(
                    450 +
                      index * 50,
                  ).duration(350)}
                  style={
                    styles.categoryRow
                  }
                >
                  <View
                    style={
                      styles.categoryHeader
                    }
                  >
                    <View
                      style={
                        styles.categoryNameContainer
                      }
                    >
                      <View
                        style={
                          styles.categoryIcon
                        }
                      >
                        <Ionicons
                          name={
                            category.icon as keyof typeof Ionicons.glyphMap
                          }
                          size={18}
                          color="#2563EB"
                        />
                      </View>

                      <Text
                        style={
                          styles.categoryName
                        }
                      >
                        {category.name}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.categoryAmount
                      }
                    >
                      {formatAmount(
                        category.amount,
                      )}{' '}
                      {currencySymbol}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.barBackground
                    }
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          width: `${Math.max(
                            width,
                            4,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              );
            },
          )
        )}
      </Animated.View>

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color="#2563EB"
        />

        <Text style={styles.infoText}>
          USD та EUR автоматично
          перераховуються за офіційним
          курсом НБУ. Вибрана валюта
          синхронізована з налаштуваннями
          застосунку.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
  },
  periodContainer: {
    marginTop: 24,
    padding: 5,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#E2E8F0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#2563EB',
  },
  currencyCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  currencyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  currencyDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  currencyButtons: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencyButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  currencyButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  currencyButtonTextActive: {
    color: '#FFFFFF',
  },
  totalCard: {
    marginTop: 14,
    padding: 20,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  totalIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.18)',
  },
  totalInfo: {
    flex: 1,
    marginLeft: 14,
  },
  totalLabel: {
    fontSize: 13,
    color: '#DBEAFE',
    fontWeight: '600',
  },
  totalAmount: {
    marginTop: 5,
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rateLoading: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateLoadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#DBEAFE',
  },
  quickStats: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    minHeight: 112,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  smallValue: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  smallLabel: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748B',
  },
  chartCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
  },
  categoryRow: {
    marginBottom: 17,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 8,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  categoryName: {
    marginLeft: 9,
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  categoryAmount: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  barBackground: {
    height: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  bar: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 35,
  },
  emptyChartTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#334155',
  },
  emptyChartText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
  },
  infoCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 16,
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
  },
  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
});