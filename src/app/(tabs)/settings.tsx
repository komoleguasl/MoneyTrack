import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

export default function SettingsScreen() {
  const {
    currency,
    setCurrency,
    categoryLimits,
    getCategorySpent,
    setCategoryLimit,
    removeCategoryLimit,
  } = useExpenses();

  const [rate, setRate] =
    useState<NbuRate | null>(null);

  const [isLoadingRate, setIsLoadingRate] =
    useState(false);

  const [limitValues, setLimitValues] =
    useState<Record<string, string>>({});

  const [savingLimit, setSavingLimit] =
    useState<string | null>(null);

  const getSavedLimit = (
    categoryId: string,
  ) => {
    const savedLimit = categoryLimits.find(
      (item) =>
        item.categoryId === categoryId,
    );

    if (savedLimit) {
      return savedLimit.limit.toString();
    }

    return '';
  };

  const getLimitValue = (
    categoryId: string,
  ) => {
    if (categoryId in limitValues) {
      return limitValues[categoryId];
    }

    return getSavedLimit(categoryId);
  };

  const handleLimitChange = (
    categoryId: string,
    value: string,
  ) => {
    setLimitValues((current) => ({
      ...current,
      [categoryId]: value,
    }));
  };

  const handleSaveLimit = async (
    categoryId: string,
  ) => {
    const rawValue =
      getLimitValue(categoryId).replace(
        ',',
        '.',
      );

    const numericValue = Number(rawValue);

    if (
      !rawValue ||
      Number.isNaN(numericValue)
    ) {
      Alert.alert(
        'Помилка',
        'Введіть коректну суму ліміту.',
      );
      return;
    }

    if (numericValue <= 0) {
      Alert.alert(
        'Помилка',
        'Ліміт повинен бути більшим за 0.',
      );
      return;
    }

    try {
      setSavingLimit(categoryId);

      await setCategoryLimit(
        categoryId,
        numericValue,
      );

      setLimitValues((current) => ({
        ...current,
        [categoryId]:
          numericValue.toString(),
      }));

      Alert.alert(
        'Ліміт збережено',
        'Ліміт категорії успішно оновлено.',
      );
    } catch {
      Alert.alert(
        'Помилка',
        'Не вдалося зберегти ліміт.',
      );
    } finally {
      setSavingLimit(null);
    }
  };

  const handleRemoveLimit = async (
    categoryId: string,
  ) => {
    try {
      await removeCategoryLimit(
        categoryId,
      );

      setLimitValues((current) => ({
        ...current,
        [categoryId]: '',
      }));
    } catch {
      Alert.alert(
        'Помилка',
        'Не вдалося видалити ліміт.',
      );
    }
  };

  const handleCurrencyChange = async (
    newCurrency: AppCurrency,
  ) => {
    try {
      await setCurrency(newCurrency);

      if (newCurrency === 'UAH') {
        setRate(null);
        return;
      }

      setIsLoadingRate(true);

      const result = await getNbuRate(
        newCurrency,
      );

      setRate(result);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Помилка',
        'Не вдалося отримати курс НБУ. Перевірте підключення до інтернету.',
      );
    } finally {
      setIsLoadingRate(false);
    }
  };

  const formatAmount = (
    amount: number,
  ) =>
    amount.toLocaleString('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInUp.duration(500)}
        style={styles.header}
      >
        <View>
          <Text style={styles.title}>
            Налаштування
          </Text>

          <Text style={styles.subtitle}>
            Параметри MoneyTrack
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="settings-outline"
            size={25}
            color="#2563EB"
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          120,
        ).duration(450)}
        style={styles.card}
      >
        <Text style={styles.sectionTitle}>
          Валюта застосунку
        </Text>

        <Text style={styles.description}>
          Вибрана валюта використовується
          в статистиці та інших екранах
          MoneyTrack.
        </Text>

        <View
          style={styles.currencyContainer}
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
                handleCurrencyChange(item)
              }
            >
              <Text
                style={[
                  styles.currencyText,
                  currency === item &&
                    styles.currencyTextActive,
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
          220,
        ).duration(450)}
        style={styles.card}
      >
        <View style={styles.rateHeader}>
          <View style={styles.rateIcon}>
            <Ionicons
              name="trending-up-outline"
              size={22}
              color="#2563EB"
            />
          </View>

          <View
            style={styles.rateHeaderText}
          >
            <Text style={styles.sectionTitle}>
              Курс НБУ
            </Text>

            <Text style={styles.description}>
              Офіційний курс гривні
            </Text>
          </View>
        </View>

        {currency === 'UAH' ? (
          <View style={styles.rateEmpty}>
            <Text
              style={styles.rateEmptyText}
            >
              Для гривні конвертація не
              потрібна.
            </Text>
          </View>
        ) : isLoadingRate ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="small"
              color="#2563EB"
            />

            <Text
              style={styles.loadingText}
            >
              Отримуємо курс НБУ...
            </Text>
          </View>
        ) : rate ? (
          <View style={styles.rateResult}>
            <Text style={styles.rateValue}>
              1 {rate.cc} ={' '}
              {rate.rate.toLocaleString(
                'uk-UA',
              )}{' '}
              ₴
            </Text>

            <Text style={styles.rateDate}>
              Дата курсу:{' '}
              {rate.exchangedate}
            </Text>
          </View>
        ) : (
          <View style={styles.rateEmpty}>
            <Text
              style={styles.rateEmptyText}
            >
              Виберіть USD або EUR, щоб
              отримати курс.
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          320,
        ).duration(450)}
        style={styles.card}
      >
        <View style={styles.limitsHeader}>
          <View style={styles.rateIcon}>
            <Ionicons
              name="warning-outline"
              size={22}
              color="#2563EB"
            />
          </View>

          <View
            style={styles.rateHeaderText}
          >
            <Text style={styles.sectionTitle}>
              Ліміти категорій
            </Text>

            <Text style={styles.description}>
              Місячний ліміт витрат у
              гривнях.
            </Text>
          </View>
        </View>

        <View style={styles.limitsInfo}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#2563EB"
          />

          <Text
            style={styles.limitsInfoText}
          >
            Якщо витрати категорії
            перевищать встановлений
            ліміт, MoneyTrack покаже
            попередження.
          </Text>
        </View>

        {CATEGORIES.map((category) => {
          const savedLimit =
            categoryLimits.find(
              (item) =>
                item.categoryId ===
                category.id,
            )?.limit;

          const spent =
            getCategorySpent(
              category.id,
            );

          const isExceeded =
            savedLimit !== undefined &&
            spent > savedLimit;

          return (
            <View
              key={category.id}
              style={styles.limitRow}
            >
              <View
                style={styles.limitCategory}
              >
                <View
                  style={styles.categoryIcon}
                >
                  <Ionicons
                    name={
                      category.icon as keyof typeof Ionicons.glyphMap
                    }
                    size={20}
                    color="#2563EB"
                  />
                </View>

                <View
                  style={
                    styles.categoryTextContainer
                  }
                >
                  <Text
                    style={styles.categoryName}
                  >
                    {category.name}
                  </Text>

                  <Text
                    style={[
                      styles.spentText,
                      isExceeded &&
                        styles.spentTextExceeded,
                    ]}
                  >
                    Витрачено:{' '}
                    {formatAmount(spent)} ₴
                  </Text>
                </View>
              </View>

              <View
                style={styles.limitControls}
              >
                <TextInput
                  value={getLimitValue(
                    category.id,
                  )}
                  onChangeText={(value) =>
                    handleLimitChange(
                      category.id,
                      value,
                    )
                  }
                  placeholder="Без ліміту"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  style={styles.limitInput}
                />

                <Pressable
                  style={[
                    styles.limitSaveButton,
                    savingLimit ===
                      category.id &&
                      styles.limitSaveButtonDisabled,
                  ]}
                  onPress={() =>
                    handleSaveLimit(
                      category.id,
                    )
                  }
                  disabled={
                    savingLimit ===
                    category.id
                  }
                >
                  {savingLimit ===
                  category.id ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                    />
                  )}
                </Pressable>

                {savedLimit !==
                undefined ? (
                  <Pressable
                    style={
                      styles.removeLimitButton
                    }
                    onPress={() =>
                      handleRemoveLimit(
                        category.id,
                      )
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color="#EF4444"
                    />
                  </Pressable>
                ) : null}
              </View>

              {isExceeded ? (
                <View
                  style={styles.warning}
                >
                  <Ionicons
                    name="warning"
                    size={16}
                    color="#DC2626"
                  />

                  <Text
                    style={styles.warningText}
                  >
                    Ліміт перевищено на{' '}
                    {formatAmount(
                      spent -
                        (savedLimit ?? 0),
                    )}{' '}
                    ₴
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(
          420,
        ).duration(450)}
        style={styles.infoCard}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={21}
          color="#2563EB"
        />

        <Text style={styles.infoText}>
          Налаштування валюти та ліміти
          зберігаються локально на
          пристрої.
        </Text>
      </Animated.View>
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
    justifyContent: 'space-between',
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
  card: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  description: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  currencyContainer: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  currencyButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
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
  currencyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  currencyTextActive: {
    color: '#FFFFFF',
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  rateHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  rateEmpty: {
    marginTop: 18,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  rateEmptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  loading: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#64748B',
  },
  rateResult: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
  },
  rateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  rateDate: {
    marginTop: 7,
    fontSize: 12,
    color: '#64748B',
  },
  limitsInfo: {
    marginTop: 18,
    padding: 13,
    borderRadius: 14,
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
  },
  limitsInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  limitRow: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  limitCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  categoryTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  spentText: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748B',
  },
  spentTextExceeded: {
    color: '#DC2626',
    fontWeight: '700',
  },
  limitControls: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 14,
    color: '#0F172A',
  },
  limitSaveButton: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  limitSaveButtonDisabled: {
    opacity: 0.6,
  },
  removeLimitButton: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  warning: {
    marginTop: 9,
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  warningText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
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