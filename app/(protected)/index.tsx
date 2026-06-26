import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    verificarSessao();
  }, []);

  const verificarSessao = async () => {
    try {
      // 1. Vai buscar o token guardado no disco do telemóvel
      const token = await AsyncStorage.getItem('userToken');
      
      // 2. Encaminha o utilizador sem deixar histórico para trás
      if (token) {
        console.log('Sessão ativa encontrada! A redirecionar para o catálogo...');
        router.replace('/(tabs)/catalogo');
      } else {
        console.log('Nenhuma sessão encontrada. A redirecionar para o login...');
        router.replace('/login');
      }
    } catch (error) {
      console.log('Erro ao verificar sessão no arranque:', error);
      router.replace('/login');
    }
  };

  // Enquanto verifica o token, mostra apenas um ecrã de carregamento limpo
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
      <ActivityIndicator size="large" color="#005596" />
    </View>
  );
}