import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import api from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resultado, setResultado] = useState('');

  const testarRegisto = async () => {
    try {
      const response = await api.post('/register', { 
        name, 
        email, 
        password 
      });
      setResultado('Sucesso: ' + JSON.stringify(response.data));
    } catch (error: any) {
      setResultado('Erro: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Criar Conta</Text>
      
      <TextInput placeholder="Nome" onChangeText={setName} value={name} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Senha" onChangeText={setPassword} value={password} secureTextEntry style={{ borderBottomWidth: 1, marginBottom: 20 }} />
      
      <Button title="Criar Conta" onPress={testarRegisto} />
      <Text style={{ marginTop: 20, color: 'green' }}>{resultado}</Text>
    </View>
  );
}