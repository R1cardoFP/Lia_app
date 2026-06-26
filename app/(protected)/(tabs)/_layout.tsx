import { Ionicons } from '@expo/vector-icons'; // Já vem instalado no Expo!
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A237E', // O teu azul escuro para a tab ativa
        tabBarInactiveTintColor: '#B0BEC5', // Cinzento para as inativas
        headerShown: false, // Escondemos o header padrão porque o teu design já tem o "BOM DIA"
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10, // Sombra no Android
          shadowOpacity: 0.1, // Sombra no iOS
          height: 65, // Um pouco mais alta para ficar confortável
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        }
      }}
    >
      {/* 1. TAB: CATÁLOGO (ficheiro index.tsx) */}
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 2. TAB: RESERVAS (ficheiro reservas.tsx) */}
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3. TAB: PERFIL (ficheiro perfil.tsx) */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}