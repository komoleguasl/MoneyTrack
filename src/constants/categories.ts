import { ExpenseCategory } from '../types/expense';

export const CATEGORIES: ExpenseCategory[] = [
  {
    id: 'food',
    name: 'Їжа',
    icon: 'restaurant-outline',
  },
  {
    id: 'transport',
    name: 'Транспорт',
    icon: 'car-outline',
  },
  {
    id: 'shopping',
    name: 'Покупки',
    icon: 'cart-outline',
  },
  {
    id: 'home',
    name: 'Дім',
    icon: 'home-outline',
  },
  {
    id: 'health',
    name: 'Здоровʼя',
    icon: 'medkit-outline',
  },
  {
    id: 'entertainment',
    name: 'Розваги',
    icon: 'game-controller-outline',
  },
  {
    id: 'education',
    name: 'Освіта',
    icon: 'school-outline',
  },
  {
    id: 'other',
    name: 'Інше',
    icon: 'ellipsis-horizontal-circle-outline',
  },
];
