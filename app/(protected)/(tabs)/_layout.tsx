import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#065294', 
        tabBarInactiveTintColor: '#B0BEC5', 
        headerShown: false, 
        tabBarBackground: () => null, 
        tabBarStyle: {
          position: 'absolute', 
          backgroundColor: '#FFF', 
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 0,
          elevation: 10, 
          shadowOpacity: 0.1, 
          height: 65 + Math.max(insets.bottom, 0),
          paddingBottom: Math.max(insets.bottom, 10), 
          paddingTop: 10
        },
      }}
    >
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="fazer-reserva"
        options={{
          title: 'Reservar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      

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