import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1D4ED8',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#F3F4F6',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Sistema Acadêmico',
        }}
      />
    </Stack>
  );
}
