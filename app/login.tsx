import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Faltava este import!
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resultado, setResultado] = useState('');

  const testarLogin = async () => {
    try {
      const response = await api.post('/login', { email, password });

      // 1. Apanhar exatamente a chave que vimos no teu Postman
      const token = response.data.token;

      if (token) {
        // 2. Guardar fisicamente no telemóvel
        await AsyncStorage.setItem('userToken', token);
        
        // (Opcional) Guardar o nome do utilizador para mostrar no Header do Catálogo
        if (response.data.user && response.data.user.name) {
            await AsyncStorage.setItem('userName', response.data.user.name);
        }
        
        setResultado('Login feito com sucesso!');
        
        // 3. Ir para o ecrã do Catálogo (apenas uma vez!)
        router.replace('/(tabs)/catalogo');
      } else {
        setResultado('Login feito, mas não recebemos token do servidor.');
      }
      
    } catch (error: any) {
      if (error.response) {
        const mensagemErro = error.response.data.message || 'Erro nas credenciais.';
        setResultado(`Erro do Servidor: ${mensagemErro}`);
      } else {
        setResultado('Não foi possível conectar ao servidor. Verifique o IP e a rede.');
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput 
        placeholder="Email" 
        onChangeText={setEmail} 
        value={email} 
        autoCapitalize="none" // <-- Ajuda a evitar erros de digitação no email
        style={{ borderBottomWidth: 1, marginBottom: 10 }} 
      />
      <TextInput 
        placeholder="Senha" 
        onChangeText={setPassword} 
        value={password} 
        secureTextEntry 
        style={{ borderBottomWidth: 1, marginBottom: 20 }} 
      />
      <Button title="Entrar" onPress={testarLogin} />
      <Text style={{ marginTop: 20, color: 'blue', textAlign: 'center' }}>{resultado}</Text>
    </View>
  );
}