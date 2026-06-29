import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, KeyboardTypeOptions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { API_URL } from '../../services/api';


interface InputGroupProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName: keyof typeof Ionicons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  placeholder?: string;
}

const TIPOS_UTILIZADOR = [
  { id: 1, label: 'Gestor' },
  { id: 2, label: 'Técnico' },
  { id: 3, label: 'Orientador' },
  { id: 4, label: 'Requisitante' },
  { id: 5, label: 'Bolseiro' },
  { id: 6, label: 'Visitante' },
];



const InputGroup = ({ label, value, onChangeText, iconName, keyboardType = 'default', editable = true, placeholder }: InputGroupProps) => (
  <View style={styles.inputGroupContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={iconName} size={15} color="#b0bfcc" style={styles.inputIcon} />
      <TextInput 
        style={[styles.inp, !editable && styles.inputDisabled]} 
        value={value} 
        onChangeText={onChangeText} 
        keyboardType={keyboardType} 
        editable={editable} 
        placeholder={placeholder}
        placeholderTextColor="#b0bfcc" 
      />
    </View>
  </View>
);

export default function EditarPerfil() {
  const { user, refreshUser } = useAuth();
  const [nome, setNome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [curso, setCurso] = useState('');
  const [numero, setNumero] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);


  const InputGroup = ({ label, value, onChangeText, iconName, keyboardType = 'default', editable = true, placeholder }: InputGroupProps) => (
  <View style={styles.inputGroupContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={iconName} size={15} color="#b0bfcc" style={styles.inputIcon} />
      <TextInput 
        style={[styles.inp, !editable && styles.inputDisabled]} 
        value={value} 
        onChangeText={onChangeText} 
        keyboardType={keyboardType} 
        editable={editable} 
        placeholder={placeholder}
        placeholderTextColor="#b0bfcc" 
      />
    </View>
  </View>
);

  useFocusEffect(
  useCallback(() => { carregarDados(); }, [user]) // <-- Adicionado o user aqui
);

  
    const carregarDados = () => {
    if (!user) return;
    try {
     
      
      setNome(user.name || '');
      setTelemovel(user.phone?.toString() || ''); 
      setCurso(user.curso || '');
      setNumero(user.n_aluno?.toString() || ''); 
      

      if (user.image) {
       
        const caminhoImagem = user.image.startsWith('/') ? user.image.substring(1) : user.image;
        setImageUri(`${API_URL}/${caminhoImagem}`);
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

      const telemovelLimpo = telemovel.trim();
      const apenasNumeros = /^[0-9]+$/;

    if (telemovelLimpo.length !== 9 || !apenasNumeros.test(telemovelLimpo)) {
    Alert.alert(
      'Aviso', 
      'O número de telemóvel deve conter exatamente 9 dígitos.',
      [
        {
          text: 'OK',
          onPress: () => {
            // >>> ALTERAÇÃO AQUI: Quando clica em OK, repõe o número antigo ou limpa (vazio)
            setTelemovel(user?.phone?.toString() || '');
          }
        }
      ]
    );
    return; 
  }
    setGuardando(true);
    try {

      const formData = new FormData();
      formData.append('name', nome);
      formData.append('phone', telemovelLimpo);
      formData.append('curso', curso);
      formData.append('n_aluno', numero);
    
      

      if (imageUri && !imageUri.startsWith('http')) {
        const uriPartes = imageUri.split('/');
        const nomeFicheiro = uriPartes[uriPartes.length - 1];
        const extensao = nomeFicheiro.split('.').pop();
        formData.append('image', { uri: imageUri, name: nomeFicheiro, type: `image/${extensao}` } as any);
      }

      const response = await api.post('/perfil/edit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } // <-- Só ficou o Content-Type
    });

      if (response.data.status === 'success') {
        await refreshUser();
        Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error: any) {
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
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#0d1f30" />
    </TouchableOpacity>
    <View>
      <Text style={styles.headerTitle}>Editar Perfil</Text>
      <Text style={styles.headerSubtitle}>Altera dados da tua conta</Text>
    </View>
  </View>
</View>



        <View style={styles.corpoConteudo}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.fotoContainer}>
            <TouchableOpacity onPress={escolherImagem} activeOpacity={0.8}>
              <View style={styles.avatarBig}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.imageAvatar} /> : <Text style={styles.avatarTextBig}>{getIniciais()}</Text>}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoButton} onPress={escolherImagem}><Ionicons name="camera" size={20} color="#FFF" /></TouchableOpacity>
          </View>

          <View style={styles.containerFormulario}>
            <View style={styles.formContainer}>
            <InputGroup label="Nome Completo" value={nome} onChangeText={setNome} iconName="person-outline" placeholder="Ex: João Silva" />
            <InputGroup label="Telemóvel" value={telemovel} onChangeText={setTelemovel} iconName="call-outline" keyboardType="phone-pad" placeholder="Ex: 912345678" />
            <InputGroup label="Curso" value={curso} onChangeText={setCurso} iconName="school-outline" placeholder="Ex: Engenharia Informática" />
            <InputGroup label="Número de Aluno" value={numero} onChangeText={setNumero} iconName="id-card-outline" keyboardType="numeric" placeholder="Ex: 12345" />
          </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.btnIniciar} onPress={guardarAlteracoes} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnIniciarText}>Guardar Alterações</Text>}
          </TouchableOpacity>
        </View>
         </View>
      </KeyboardAvoidingView>
   
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  // Fundo principal agora é branco puro no topo
  safeArea: { flex: 1, backgroundColor: '#ffffff' },

  // Header atualizado com padding e cores do DetalheReserva
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 13 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0d1f30' },
  headerSubtitle: { fontSize: 12, color: '#7a94aa', marginTop: 2 },
  backButton: { marginRight: 4, justifyContent: 'center', alignItems: 'center' },

  // Novo container de fundo para o scroll
  corpoConteudo: { flex: 1, backgroundColor: '#f4f7fc' },

  // Cor do loader alterada para o azul escuro padrão
  containerLoading: { flex: 1, backgroundColor: '#f4f7fc', justifyContent: 'center', alignItems: 'center', padding: 20 },
  containerFormulario: { flexDirection: 'column', gap: 14 },
  inputGroupContainer: { marginBottom: 4 },

  // ESTILOS EXATOS COPIADOS DA PÁGINA DE RESERVA
  label: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#9E9E9E',
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
    paddingLeft: 38, 
    paddingRight: 12, 
    fontSize: 14, 
    height: 46,
    color: '#333', 
  }, 
  inputDisabled: { 
    backgroundColor: '#ECEFF1', 
    color: '#9E9E9E' 
  },
  // Cor do Avatar grande alterada para o azul correspondente
  avatarBig: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#065294', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden' },

  // Bordas do botão de câmara ajustadas ao novo fundo cinza
  changePhotoButton: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: '#00BFA5', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#f4f7fc', zIndex: 10, elevation: 10 },

  // Labels dos inputs agora usam o mesmo tom cinza-azulado (#8a9fb4) e tamanho do outro ecrã
  

  btnIniciar: { 
    backgroundColor: '#065294',   // Mantém a tua cor azul original
    borderRadius: 8,              // Arredondamento igual ao do registo
    paddingVertical: 15,          // Altura baseada em padding igual ao do registo
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 15, 
  }, 
  btnIniciarText: { 
    color: '#FFF', 
    fontSize: 15,                 // Tamanho da fonte igual ao do registo
    fontWeight: '700',            // Peso da fonte igual ao do registo
  },
  
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  fotoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 45 },
  
  imageAvatar: { width: 100, height: 100, borderRadius: 50 },
  avatarTextBig: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },


  
  formContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputContainer: { marginBottom: 20 },
  
  input: { backgroundColor: '#F5F7F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 16, color: '#212121' },
  footer: { padding: 20, backgroundColor: '#f4f7fc'},

});