import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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
    
    
    await SecureStore.setItemAsync('user_token', response.data.token);
    
    setResultado('Login feito com sucesso!');
    
    
    router.replace('/(tabs)');
    
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
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Senha" onChangeText={setPassword} value={password} secureTextEntry style={{ borderBottomWidth: 1, marginBottom: 20 }} />
      <Button title="Entrar" onPress={testarLogin} />
      <Text style={{ marginTop: 20, color: 'blue' }}>{resultado}</Text>
    </View>
  );
}