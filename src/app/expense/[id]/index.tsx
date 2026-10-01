import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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
import { CATEGORIES } from '../../../constants/categories';
import { useExpenses } from '../../../context/ExpenseContext';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    expenses,
    updateExpense,
  } = useExpenses();

  const expense = useMemo(
    () => expenses.find((item) => item.id === id),
    [expenses, id],
  );

  const [title, setTitle] = useState(
    expense?.title ?? '',
  );

  const [amount, setAmount] = useState(
    expense?.amount.toString() ?? '',
  );

  const [currency, setCurrency] = useState(
    expense?.currency ?? 'UAH',
  );

  const [categoryId, setCategoryId] = useState(
    expense?.categoryId ?? CATEGORIES[0].id,
  );

  const [note, setNote] = useState(
    expense?.note ?? '',
  );

  const [isSaving, setIsSaving] = useState(false);

  if (!expense) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={56}
          color="#CBD5E1"
        />

        <Text style={styles.notFoundTitle}>
          Витрату не знайдено
        </Text>

        <Text style={styles.notFoundText}>
          Можливо, її вже було видалено.
        </Text>

        <Pressable
          style={styles.backHomeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backHomeButtonText}>
            Повернутися
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async () => {
    const normalizedAmount = Number(
      amount.replace(',', '.'),
    );

    if (!title.trim()) {
      Alert.alert(
        'Помилка',
        'Введіть назву витрати.',
      );
      return;
    }

    if (
      !amount.trim() ||
      Number.isNaN(normalizedAmount)
    ) {
      Alert.alert(
        'Помилка',
        'Введіть коректну суму.',
      );
      return;
    }

    if (normalizedAmount <= 0) {
      Alert.alert(
        'Помилка',
        'Сума повинна бути більшою за 0.',
      );
      return;
    }

    try {
      setIsSaving(true);

      await updateExpense({
        ...expense,
        title: title.trim(),
        amount: normalizedAmount,
        currency,
        categoryId,
        note: note.trim() || undefined,
      });

      router.back();
    } catch {
      Alert.alert(
        'Помилка',
        'Не вдалося оновити витрату.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.duration(450)}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#0F172A"
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title}>
                Редагування
              </Text>

              <Text style={styles.subtitle}>
                Змініть дані витрати
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(
            450,
          )}
          style={styles.card}
        >
          <Text style={styles.label}>
            Назва
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Наприклад, Продукти"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>
            Сума
          </Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>
            Валюта
          </Text>

          <View style={styles.currencyRow}>
            {['UAH', 'USD', 'EUR'].map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.currencyButton,
                  currency === item &&
                    styles.currencyButtonActive,
                ]}
                onPress={() =>
                  setCurrency(item)
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

          <Text style={styles.label}>
            Категорія
          </Text>

          <View style={styles.categories}>
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryButton,
                  categoryId === category.id &&
                    styles.categoryButtonActive,
                ]}
                onPress={() =>
                  setCategoryId(category.id)
                }
              >
                <Ionicons
                  name={
                    category.icon as keyof typeof Ionicons.glyphMap
                  }
                  size={22}
                  color={
                    categoryId === category.id
                      ? '#FFFFFF'
                      : '#2563EB'
                  }
                />

                <Text
                  style={[
                    styles.categoryText,
                    categoryId === category.id &&
                      styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            Заметка
          </Text>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Необов'язково"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.noteInput,
            ]}
          />

          <Pressable
            style={[
              styles.saveButton,
              isSaving &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons
              name="save-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              {isSaving
                ? 'Збереження...'
                : 'Зберегти зміни'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  noteInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  currencyButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  currencyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  currencyTextActive: {
    color: '#FFFFFF',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    width: '47%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  categoryButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    height: 56,
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F8FAFC',
  },
  notFoundTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
  },
  notFoundText: {
    marginTop: 6,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  backHomeButton: {
    marginTop: 20,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  backHomeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});