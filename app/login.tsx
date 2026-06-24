import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
 
export default function Login() { 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [secureText, setSecureText] = useState(true); 
  const [resultado, setResultado] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
 
  const testarLogin = async () => { 
    setLoading(true);
    setIsError(false);
    setResultado('');

    
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setResultado('O email e a palavra-passe são obrigatórios.');
      setIsError(true); 
      setLoading(false);
      return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setResultado('Por favor, introduza um formato de email válido.');
      setIsError(true); 
      setLoading(false);
      return;
    }
    try { 
      const response = await api.post('/login', { email: emailTrimmed, password: passwordTrimmed });
      const token = response.data.token; 
 
      if (token) { 
        await AsyncStorage.setItem('userToken', token); 
        if (response.data.user && response.data.user.name) { 
          await AsyncStorage.setItem('userName', response.data.user.name); 
        } 
        setResultado('Login feito com sucesso!'); 
        setIsError(false);
        router.replace('/(tabs)'); 
      } else { 
        setResultado('Ocorreu um erro inesperado. Por favor, tente novamente.');
        setIsError(true); 
      } 
    } catch (error: any) { 
      setIsError(true);
      if (error.response) { 
        const mensagemErro = error.response.data.message || 'Credenciais inválidas.'; 
        setResultado(`${mensagemErro}`); 
      } else { 
        setResultado('Não foi possível conectar ao servidor. Verifique a rede.'); 
      } 
    } 
    setLoading(false);
  }; 
 
  return ( 
    <View style={styles.container}> 
      {/* Ajusta a barra de estado para combinar com o topo azul escuro */} 
      <StatusBar barStyle="light-content" backgroundColor="#065294" /> 
 
      {/*   BLOCO SUPERIOR AZUL (#065294) */} 
      <View style={styles.header}> 
        <View style={styles.logoIconContainer}> 
          <Feather name="camera" size={28} color="#fff" /> 
        </View> 
        <Text style={styles.headerTitle}>LIA Reservas</Text> 
        <Text style={styles.headerSubtitle}>Equipamentos Audiovisuais</Text> 
      </View> 
 
      {/*    BLOCO BRANCO INFERIOR OVERLAP */} 
      <View style={styles.formContainer}> 
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}> 
           
          <Text style={styles.welcomeText}>Bem-vindo de volta</Text> 
 
          <View style={styles.inputGroup}> 
            {/*       Campo Email */} 
            <Text style={styles.label}>Email</Text> 
            <View style={styles.inputWrapper}> 
              <Feather name="mail" size={15} color="#b0bfcc" style={styles.inputIconLeft} /> 
              <TextInput 
                style={styles.inp} 
                placeholder="utilizador@ipvc.pt" 
                placeholderTextColor="#b0bfcc" 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
                keyboardType="email-address" 
              /> 
            </View> 
 
            {/*     Campo Palavra-passe */} 
            <Text style={styles.label}>Palavra-passe</Text> 
            <View style={styles.inputWrapper}> 
              <Feather name="lock" size={15} color="#b0bfcc" style={styles.inputIconLeft} /> 
              <TextInput 
                style={[styles.inp, { paddingRight: 40 }]} 
                placeholder="••••••••" 
                placeholderTextColor="#b0bfcc" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={secureText} 
              /> 
              <TouchableOpacity  
                style={styles.inputIconRight}  
                onPress={() => setSecureText(!secureText)} 
              > 
                <Feather name={secureText ? "eye" : "eye-off"} size={15} color="#b0bfcc" /> 
              </TouchableOpacity> 
            </View> 
          </View> 
 
          {/*   Esqueceu a palavra-passe */} 
          <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}> 
            <Text style={styles.forgotPasswordText}>Esqueceu a palavra-passe?</Text> 
          </TouchableOpacity> 
 
          {/*    Botões de Ação */} 
          <View style={styles.buttonGroup}> 
            <TouchableOpacity style={styles.btnP} onPress={testarLogin} activeOpacity={0.9}> 
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextP}>Entrar</Text>}
            </TouchableOpacity> 
 
            <TouchableOpacity style={styles.btnT} onPress={() => router.push('/register')} activeOpacity={0.8}> 
              <Text style={styles.btnTextT}>Criar conta</Text> 
            </TouchableOpacity> 
          </View> 
 
          {/*  
          <View style={styles.dividerRow}> 
            <View style={styles.dividerLine} /> 
            <Text style={styles.dividerText}>ou</Text> 
            <View style={styles.dividerLine} /> 
          </View> 
          */} 
          {/*  
          <TouchableOpacity style={styles.btnSSO} activeOpacity={0.8}> 
            <Feather name="home" size={16} color="#3a5a7a" style={{ marginRight: 8 }} /> 
            <Text style={styles.btnSSOText}>SSO Institucional</Text> 
          </TouchableOpacity> 
*/} 
          {resultado !== '' && ( 
            <Text style={[styles.feedbackText, { color: isError ? '#e74c3c' : '#2ecc71' }]}> 
              {resultado} 
            </Text> 
          )}
 
        </ScrollView> 
      </View> 
    </View> 
  ); 
} 
 
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
  }, 
  header: { 
    backgroundColor: '#065294', 
    paddingHorizontal: 24, 
    paddingBottom: 48, 
    alignItems: 'center', 
  }, 
  logoIconContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 14, 
  }, 
  headerTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#fff', 
    letterSpacing: 0.4, 
  }, 
  headerSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255, 255, 255, 0.6)', 
    marginTop: 4, 
  }, 
  formContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    marginTop: -20, 
    paddingHorizontal: 22, 
    paddingTop: 28, 
  }, 
  welcomeText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0d1f30', 
    marginBottom: 20, 
  }, 
  inputGroup: { 
    flexDirection: 'column', 
    gap: 12, 
    marginBottom: 6, 
  }, 
  label: { 
    fontSize: 10.5, 
    fontWeight: '600', 
    color: '#7a94aa', 
    marginBottom: 5, 
    letterSpacing: 0.5, 
    textTransform: 'uppercase', 
  }, 
  inputWrapper: { 
    position: 'relative', 
    justifyContent: 'center', 
  }, 
  inputIconLeft: { 
    position: 'absolute', 
    left: 13, 
    zIndex: 1, 
  }, 
  inputIconRight: { 
    position: 'absolute', 
    right: 13, 
    padding: 5, 
    zIndex: 1, 
  }, 
  inp: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingLeft: 38, 
    paddingRight: 12, 
    fontSize: 13, 
    paddingVertical: 10, 
    color: '#333', 
  }, 
  forgotPasswordContainer: { 
    alignItems: 'flex-end', 
    marginBottom: 20, 
    marginTop: 8, 
  }, 
  forgotPasswordText: { 
    fontSize: 12, 
    color: '#00a385',
    fontWeight: '600', 
  }, 
  buttonGroup: { 
    flexDirection: 'column', 
    gap: 10, 
  }, 
  btnP: { 
    backgroundColor: '#065294', 
    borderRadius: 8, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
  }, 
  btnTextP: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700', 
  }, 
  btnT: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#065294', 
    borderRadius: 8, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
  }, 
  btnTextT: { 
    color: '#065294', 
    fontSize: 15, 
    fontWeight: '700', 
  }, 
  dividerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginVertical: 18, 
  }, 
  dividerLine: { 
    flex: 1, 
    height: 1.5, 
    backgroundColor: '#f0f4f8', 
  }, 
  dividerText: { 
    fontSize: 11, 
    color: '#b0bfcc', 
    fontWeight: '500', 
  }, 
  btnSSO: { 
    width: '100%', 
    backgroundColor: '#f4f7fc', 
    borderRadius: 50,  
    paddingVertical: 13, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
  }, 
  btnSSOText: { 
    color: '#3a5a7a', 
    fontSize: 13, 
    fontWeight: '600', 
  }, 
  feedbackText: { 
    marginTop: 20, 
textAlign: 'center', 
fontSize: 14, 
fontWeight: '600', 
} 
});