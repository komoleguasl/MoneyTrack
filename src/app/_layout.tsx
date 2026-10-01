import { Stack } from 'expo-router';
import { ExpenseProvider } from '../context/ExpenseContext';

export default function RootLayout() {
  return (
    <ExpenseProvider>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="add-expense"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </ExpenseProvider>
  );
}