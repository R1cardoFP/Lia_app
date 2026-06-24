import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

// 1. CARGOS ATUALIZADOS DA TUA BASE DE DADOS
const TIPOS_UTILIZADOR = [
  { id: 1, label: 'Gestor' },
  { id: 2, label: 'Técnico' },
  { id: 3, label: 'Orientador' },
  { id: 4, label: 'Requisitante' },
  { id: 5, label: 'Bolseiro' },
  { id: 6, label: 'Visitante' },
];

const InputGroup = ({ label, value, onChangeText, keyboardType = 'default', editable = true }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input, !editable && styles.inputDisabled]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} editable={editable} placeholderTextColor="#9E9E9E" />
  </View>
);

export default function EditarPerfil() {
  const [nome, setNome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [curso, setCurso] = useState('');
  const [numero, setNumero] = useState('');
  const [imageUri, setImageUri] = useState(null); 
  const [tipoSelecionado, setTipoSelecionado] = useState(TIPOS_UTILIZADOR[3]); // Default: Requisitante
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);

  useFocusEffect(
    useCallback(() => { carregarDados(); }, [])
  );

  const carregarDados = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.get('/me', { headers: { Authorization: `Bearer ${token}` } });
      const user = response.data;
      
      setNome(user.name || '');
      setTelemovel(user.phone?.toString() || ''); 
      setCurso(user.curso || '');
      setNumero(user.n_aluno?.toString() || ''); 
      
      // 2. LER O user_type_id
      const tipoUserDb = TIPOS_UTILIZADOR.find(t => t.id === user.user_type_id);
      if (tipoUserDb) setTipoSelecionado(tipoUserDb);

      // Se for Gestor (1) ou Técnico (2), desbloqueia o botão (fica true)
      if (user.user_type_id === 1 || user.user_type_id === 2) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      if (user.image) {
        // IP A FUNCIONAR
        const baseURL = 'http://192.168.1.81:8000'; 
        const caminhoImagem = user.image.startsWith('/') ? user.image.substring(1) : user.image;
        setImageUri(`${baseURL}/${caminhoImagem}`);
      }
    } catch (error) {
      console.log('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const escolherImagem = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissao.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso às tuas fotos.');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        setImageUri(resultado.assets[0].uri); 
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um problema ao tentar abrir a galeria.');
    }
  };

  const guardarAlteracoes = async () => {
    setGuardando(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formData = new FormData();
      formData.append('name', nome);
      formData.append('phone', telemovel);
      formData.append('curso', curso);
      formData.append('n_aluno', numero);
      // 3. ENVIAR O user_type_id
      formData.append('user_type_id', tipoSelecionado.id.toString());

      if (imageUri && !imageUri.startsWith('http')) {
        const uriPartes = imageUri.split('/');
        const nomeFicheiro = uriPartes[uriPartes.length - 1];
        const extensao = nomeFicheiro.split('.').pop();
        formData.append('image', { uri: imageUri, name: nomeFicheiro, type: `image/${extensao}` } as any);
      }

      const response = await api.post('/perfil/edit', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        await AsyncStorage.setItem('userName', nome);
        Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error) {
      Alert.alert('Erro do Servidor', error.response?.data?.message || 'Erro desconhecido.');
    } finally {
      setGuardando(false);
    }
  };

  const getIniciais = () => {
    if (!nome) return 'LI';
    const partes = nome.trim().split(' ');
    if (partes.length > 1) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#005596" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.fotoContainer}>
            <TouchableOpacity onPress={escolherImagem} activeOpacity={0.8}>
              <View style={styles.avatarBig}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.imageAvatar} /> : <Text style={styles.avatarTextBig}>{getIniciais()}</Text>}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoButton} onPress={escolherImagem}><Ionicons name="camera" size={20} color="#FFF" /></TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <InputGroup label="Nome Completo" value={nome} onChangeText={setNome} />
            <InputGroup label="Telemóvel" value={telemovel} onChangeText={setTelemovel} keyboardType="phone-pad" />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Utilizador</Text>
              
              {/* --- LÓGICA DE UI DINÂMICA: SELETOR VS TEXTO --- */}
              {isAdmin ? (
                // Se for Admin, mostra o seletor interativo
                <TouchableOpacity 
                  style={[styles.input, { justifyContent: 'center' }]} 
                  onPress={() => setModalVisivel(true)} 
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#212121', fontSize: 16 }}>
                    {tipoSelecionado.label}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#757575" style={{ position: 'absolute', right: 15 }} />
                </TouchableOpacity>
              ) : (
                // Se não for Admin, mostra apenas o texto estático styled como input
                <Text style={[styles.input, styles.inputDisabled, { justifyContent: 'center', textAlignVertical: 'center' }]}>
                  {tipoSelecionado.label}
                </Text>
              )}
            </View>

            <InputGroup label="Curso" value={curso} onChangeText={setCurso} />
            <InputGroup label="Número" value={numero} onChangeText={setNumero} keyboardType="numeric" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={guardarAlteracoes} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Guardar Alterações</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* O Modal continua aqui para quando o Admin está a editar */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Tipo</Text>
            {TIPOS_UTILIZADOR.map((tipo) => (
              <TouchableOpacity key={tipo.id} style={styles.modalOpcao} onPress={() => { setTipoSelecionado(tipo); setModalVisivel(false); }}>
                <Text style={[styles.modalOpcaoText, tipoSelecionado.id === tipo.id && styles.modalOpcaoAtiva]}>{tipo.label}</Text>
                {tipoSelecionado.id === tipo.id && <Ionicons name="checkmark" size={20} color="#005596" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalVisivel(false)}><Text style={styles.modalCancelarText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  fotoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarBig: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#005596', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  imageAvatar: { width: 100, height: 100, borderRadius: 50 },
  avatarTextBig: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  changePhotoButton: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: '#00BFA5', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F8F9FA',zIndex: 10, elevation: 10 },
  formContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#546E7A', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F5F7F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 16, color: '#212121' },
  inputDisabled: { backgroundColor: '#ECEFF1', color: '#9E9E9E' },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  saveButton: { backgroundColor: '#005596', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#005596', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 15, textAlign: 'center' },
  modalOpcao: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalOpcaoText: { fontSize: 16, color: '#546E7A' },
  modalOpcaoAtiva: { color: '#005596', fontWeight: 'bold' },
  modalCancelar: { marginTop: 15, paddingVertical: 15, alignItems: 'center' },
  modalCancelarText: { fontSize: 16, fontWeight: 'bold', color: '#E53935' }
});