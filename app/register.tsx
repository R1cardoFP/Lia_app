import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Corrige o Aviso de Depreciação 
import api from '../services/api';
 
export default function Register() { 
  const router = useRouter(); 
 
  const [name, setName] = useState(''); 
  const [studentNumber, setStudentNumber] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState(''); 
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
       
      setTimeout(() => router.replace('/login'), 1500); 
       
    } catch (error: any) { 
      setResultado('Erro: ' + (error.response?.data?.message || error.message)); 
    } 
  }; 
 
  return ( 
    <View style={styles.container}> 
      <StatusBar barStyle="light-content" backgroundColor="#00a385" /> 
       
      {/*   BLOCO SUPERIOR VERDE */} 
      <View style={styles.header}> 
        <SafeAreaView edges={['top']}> 
          <Text style={styles.headerTitle}>Criar conta</Text> 
          <Text style={styles.headerSubtitle}>Preencha os seus dados</Text> 
        </SafeAreaView> 
      </View> 
 
      {/*    BLOCO BRANCO INFERIOR */} 
      <View style={styles.formContainer}> 
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}> 
           
          <View style={styles.inputGroup}> 
             
            {/*      Campo: Nome */} 
            <Text style={styles.label}>Nome</Text> 
            <View style={styles.inputWrapper}> 
              <Feather name="user" size={14} color="#b0bfcc" style={styles.inputIcon} /> 
              <TextInput  
                style={styles.inp}  
                placeholder="Ana Oliveira"  
                placeholderTextColor="#b0bfcc" 
                value={name} 
                onChangeText={setName} 
              /> 
            </View> 
 
            {/*     Campo: Nº Estudante */} 
            <Text style={styles.label}>Nº Estudante</Text> 
            <View style={styles.inputWrapper}> 
              <Feather name="user-check" size={14} color="#b0bfcc" style={styles.inputIcon} /> 
              <TextInput  
                style={styles.inp}  
                placeholder="A12345678"  
                placeholderTextColor="#b0bfcc" 
                value={studentNumber} 
                onChangeText={setStudentNumber} 
              /> 
            </View> 
 
            {/*       Campo: Email */} 
            <Text style={styles.label}>Email</Text> 
            <View style={styles.inputWrapper}> 
              <Feather name="mail" size={14} color="#b0bfcc" style={styles.inputIcon} /> 
              <TextInput  
                style={styles.inp}  
                placeholder="utilizador@lia.pt"  
                placeholderTextColor="#b0bfcc" 
                autoCapitalize="none" 
                keyboardType="email-address" 
                value={email} 
                onChangeText={setEmail} 
              /> 
            </View> 
 
            {/*        Campo: Telemóvel */} 
            <Text style={styles.label}>Telemóvel</Text> 
            <View style={styles.inputWrapper}> 
              <Feather name="phone" size={14} color="#b0bfcc" style={styles.inputIcon} /> 
              <TextInput  
                style={styles.inp}  
                placeholder="+351 9xx xxx xxx"  
                placeholderTextColor="#b0bfcc" 
                keyboardType="phone-pad" 
                value={phone} 
                onChangeText={setPhone} 
              /> 
            </View> 
 
            {/*    Duas colunas lado a lado para as Passwords */} 
            <View style={styles.gridRow}> 
              {/* Coluna Esquerda: Password */} 
              <View style={{ flex: 1 }}> 
                <Text style={styles.label}>Password</Text> 
                <View style={styles.inputWrapper}> 
                  <Feather name="lock" size={14} color="#b0bfcc" style={styles.inputIcon} /> 
                  <TextInput  
                    style={[styles.inp, { paddingLeft: 34 }]}  
                    secureTextEntry 
                    placeholder="••••••••" 
                    placeholderTextColor="#b0bfcc" 
                    value={password} 
                    onChangeText={setPassword} 
                  /> 
                </View> 
              </View> 
 
              {/* Coluna Direita: Confirmar */} 
              <View style={{ flex: 1 }}> 
                <Text style={styles.label}>Confirmar</Text> 
                <View style={styles.inputWrapper}> 
                  <Ionicons name="lock-closed-outline" size={14} color="#b0bfcc" style={styles.inputIcon} /> 
                  <TextInput  
                    style={[styles.inp, { paddingLeft: 34 }]}  
                    secureTextEntry 
                    placeholder="••••••••" 
                    placeholderTextColor="#b0bfcc" 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  /> 
                </View> 
              </View> 
            </View> 
          </View> 
 
          {/*   BOTÃO PRINCIPAL VERDE */} 
          <TouchableOpacity style={styles.btnP} onPress={testarRegisto} activeOpacity={0.9}> 
            <Text style={styles.btnText}>Criar conta</Text> 
          </TouchableOpacity> 
 
          <Text style={styles.bottomLoginText}> 
            Já tem conta? <Text style={styles.bottomLoginLink} onPress={() => router.push('/login')}>Entrar</Text> 
          </Text> 
 
          {/*  /  Mensagem de feedback da API */} 
          {resultado !== '' && ( 
            <Text style={[styles.feedbackText, { color: resultado.startsWith('Erro') ? '#e74c3c' : '#2ecc71' }]}> 
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
    backgroundColor: '#00a385', 
    paddingHorizontal: 22, 
    paddingTop: 20, 
    paddingBottom: 44, 
  }, 
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#fff', 
  }, 
  headerSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.65)', 
    marginTop: 3, 
  }, 
  formContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    marginTop: -20, 
    paddingHorizontal: 22, 
    paddingTop: 26, 
  }, 
  inputGroup: { 
    flexDirection: 'column', 
    gap: 11, 
    marginBottom: 14, 
  }, 
  label: { 
    fontSize: 10.5, 
    fontWeight: '600', 
    color: '#7a94aa', 
    marginBottom: 4, 
    letterSpacing: 0.5, 
    textTransform: 'uppercase', 
  }, 
  inputWrapper: { 
    position: 'relative', 
    justifyContent: 'center', 
  }, 
  inputIcon: { 
    position: 'absolute', 
    left: 12, 
    zIndex: 1, 
  }, 
  inp: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingLeft: 36, 
    paddingRight: 12, 
    fontSize: 13, 
    paddingVertical: 10, 
    color: '#333', 
  }, 
  gridRow: { 
    flexDirection: 'row', 
    gap: 10, 
  }, 
  btnP: { 
    backgroundColor: '#00a385', 
    borderRadius: 8, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 24, 
  }, 
  btnText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700', 
  }, 
  feedbackText: { 
    marginTop: 20, 
    textAlign: 'center', 
    fontSize: 14, 
    fontWeight: '600', 
  }, 
  bottomLoginText: { 
textAlign: 'center', 
marginTop: 16, 
fontSize: 13, 
color: '#5a7590', 
fontWeight: '500', 
}, 
bottomLoginLink: { 
color: '#00a385', 
fontWeight: '700', 
}, 
});