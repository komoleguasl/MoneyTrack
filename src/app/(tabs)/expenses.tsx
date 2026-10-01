import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CATEGORIES } from '../../constants/categories';
import { useExpenses } from '../../context/ExpenseContext';
import { Expense } from '../../types/expense';

export default function ExpensesScreen() {
  const {
    expenses,
    deleteExpense,
    isLoading,
  } = useExpenses();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredExpenses = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !normalizedSearch ||
        expense.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        expense.note
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === 'all' ||
        expense.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 500),
    );

    setRefreshing(false);
  };

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      'Видалити витрату?',
      `Ви дійсно хочете видалити «${expense.title}»?`,
      [
        {
          text: 'Скасувати',
          style: 'cancel',
        },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(expense.id);
          },
        },
      ],
    );
  };

  const handleOpenExpense = (expense: Expense) => {
    router.push({
      pathname: '/expense/[id]',
      params: {
        id: expense.id,
      },
    });
  };

  const getCategory = (categoryId: string) => {
    return (
      CATEGORIES.find(
        (category) => category.id === categoryId,
      ) ?? CATEGORIES[CATEGORIES.length - 1]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderExpense = ({
    item,
    index,
  }: {
    item: Expense;
    index: number;
  }) => {
    const category = getCategory(item.categoryId);

    return (
      <Animated.View
        entering={FadeInDown.delay(
          Math.min(index * 50, 300),
        ).duration(350)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.expenseCard,
            pressed && styles.expenseCardPressed,
          ]}
          onPress={() => handleOpenExpense(item)}
        >
          <View style={styles.categoryIcon}>
            <Ionicons
              name={
                category.icon as keyof typeof Ionicons.glyphMap
              }
              size={23}
              color="#2563EB"
            />
          </View>

          <View style={styles.expenseInfo}>
            <Text
              style={styles.expenseTitle}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <Text style={styles.expenseMeta}>
              {category.name} • {formatDate(item.date)}
            </Text>

            {item.note ? (
              <Text
                style={styles.expenseNote}
                numberOfLines={1}
              >
                {item.note}
              </Text>
            ) : null}
          </View>

          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>
              {item.amount.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            <Text style={styles.currency}>
              {item.currency}
            </Text>

            <Pressable
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation();
                handleDelete(item);
              }}
            >
              <Ionicons
                name="trash-outline"
                size={17}
                color="#EF4444"
              />
            </Pressable>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#CBD5E1"
            style={styles.chevron}
          />
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Витрати
          </Text>

          <Text style={styles.subtitle}>
            Усього записів: {expenses.length}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="wallet-outline"
            size={25}
            color="#2563EB"
          />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#94A3B8"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Пошук витрат..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />

        {search.length > 0 ? (
          <Pressable
            onPress={() => setSearch('')}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#94A3B8"
            />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredExpenses.length === 0
            ? styles.emptyList
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.filters}>
            <Pressable
              style={[
                styles.filterButton,
                selectedCategory === 'all' &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setSelectedCategory('all')
              }
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === 'all' &&
                    styles.filterTextActive,
                ]}
              >
                Усі
              </Text>
            </Pressable>

            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.filterButton,
                  selectedCategory === category.id &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedCategory(category.id)
                }
              >
                <Ionicons
                  name={
                    category.icon as keyof typeof Ionicons.glyphMap
                  }
                  size={16}
                  color={
                    selectedCategory === category.id
                      ? '#FFFFFF'
                      : '#475569'
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    selectedCategory === category.id &&
                      styles.filterTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  search ||
                  selectedCategory !== 'all'
                    ? 'search-outline'
                    : 'receipt-outline'
                }
                size={42}
                color="#CBD5E1"
              />
            </View>

            <Text style={styles.emptyTitle}>
              {search ||
              selectedCategory !== 'all'
                ? 'Нічого не знайдено'
                : 'Витрат ще немає'}
            </Text>

            <Text style={styles.emptyText}>
              {search ||
              selectedCategory !== 'all'
                ? 'Спробуйте змінити пошук або фільтр.'
                : 'Додайте свою першу витрату на головній сторінці.'}
            </Text>
          </View>
        }
      />

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>
            Завантаження...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  searchContainer: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  filterButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 30,
  },
  expenseCard: {
    minHeight: 88,
    marginBottom: 10,
    padding: 14,
    paddingRight: 10,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  expenseCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  expenseMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  expenseNote: {
    marginTop: 3,
    fontSize: 11,
    color: '#94A3B8',
  },
  expenseRight: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  currency: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  deleteButton: {
    marginTop: 7,
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  chevron: {
    marginLeft: 5,
  },
  emptyList: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 19,
    fontWeight: '800',
    color: '#334155',
  },
  emptyText: {
    marginTop: 7,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
    color: '#94A3B8',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(248, 250, 252, 0.75)',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
});