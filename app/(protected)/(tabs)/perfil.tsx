import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { API_URL } from '../../../services/api';


interface OpcaoMenuProps {
  icone: any;
  titulo: string;
  corIcone?: string;
  corTexto?: string;
  fundoIcone?: string;
  onPress: () => void;
}

export default function Perfil() {
  const { user, logout, refreshUser } = useAuth();
  const [userData, setUserData] = useState({ name: 'Carregando...', email: '', role: 'Estudante' });
  const [userInitials, setUserInitials] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [stats, setStats] = useState({ reservas: 0, ativas: 0, itens_usados: 0 });
  const [modalAjuda, setModalAjuda] = useState(false);



   useFocusEffect(
    useCallback(() => {
      if (user) {
        processarDadosUtilizador();
        carregarEstatisticas();
      }
    }, [user])
  );


  const processarDadosUtilizador = () => {
    if (!user) return;
    const TIPOS: Record<number, string> = { 
      1: 'Gestor', 
      2: 'Técnico', 
      3: 'Orientador', 
      4: 'Requisitante', 
      5: 'Bolseiro', 
      6: 'Visitante' 
    };

    setUserData({
      name: user.name || 'Utilizador LIA',
      email: user.email || 'estudante@ipvc.pt',
      role: user.user_type_id && TIPOS[user.user_type_id] ? TIPOS[user.user_type_id] : 'Utilizador'
    });

    const partesNome = (user.name || '').trim().split(' ');
    setUserInitials(partesNome.length > 1 
      ? (partesNome[0][0] + partesNome[partesNome.length - 1][0]).toUpperCase() 
      : (user.name || 'LI').substring(0, 2).toUpperCase()
    );

    if (user.image) {
       
      const caminhoImagem = user.image.startsWith('/') ? user.image.substring(1) : user.image;
      setImageUri(`${API_URL}/${caminhoImagem}`);
    } else {
      setImageUri(null);
    }
  };

   const carregarEstatisticas = async () => {
    try {
      const response = await api.get('/perfil/estatisticas');
      if (response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (err) {
      console.log('Erro ao carregar estatísticas:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Terminar Sessão",
      "Tens a certeza que pretendes sair?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const OpcaoMenu = ({ icone, titulo, corIcone = '#546E7A', corTexto = '#212121', fundoIcone = '#F5F5F5', onPress }: OpcaoMenuProps) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: fundoIcone }]}>
        <Ionicons name={icone} size={20} color={corIcone} />
      </View>
      <Text style={[styles.menuText, { color: corTexto }]}>{titulo}</Text>
      <Ionicons name="chevron-forward" size={20} color="#E0E0E0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* --- CABEÇALHO AZUL --- */}
        <View style={styles.headerBackground}>
          <View style={styles.avatarBig}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imageAvatar} />
            ) : (
              <Text style={styles.avatarTextBig}>{userInitials}</Text>
            )}
          </View>
          
          <Text style={styles.nameText}>{userData.name}</Text>
          <Text style={styles.emailText}>{userData.email}</Text> 
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userData.role}</Text>
          </View>
        </View>

        {/* --- CARTÃO DE ESTATÍSTICAS --- */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumberBlue}>{stats.reservas}</Text>
            <Text style={styles.statLabel}>Reservas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumberGreen}>{stats.ativas}</Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumberDark}>{stats.itens_usados}</Text>
            <Text style={styles.statLabel}>Itens usados</Text>
          </View>
        </View>

        {/* --- LISTA DE OPÇÕES --- */}
        <View style={styles.menuContainer}>
          <OpcaoMenu icone="time-outline" titulo="Histórico de Requisições" onPress={() => router.push('/reservas')} />
          <OpcaoMenu icone="person-outline" titulo="Editar perfil" onPress={() => router.push('/editar-perfil')} />
          <OpcaoMenu icone="help-circle-outline" titulo="Ajuda & Suporte"  onPress={() => setModalAjuda(true)} />
          <View style={styles.espacadorMenu} />
          <OpcaoMenu icone="log-out-outline" titulo="Terminar sessão" corTexto="#E53935" corIcone="#E53935" fundoIcone="#FFEBEE" onPress={handleLogout} />
        </View>

      </ScrollView>

      <Modal visible={modalAjuda} transparent animationType="fade">
        <View style={styles.ajudaOverlay}>
          <View style={styles.ajudaContent}>
            <View style={styles.ajudaIconCirculo}>
              <Ionicons name="headset-outline" size={32} color="#005596" />
            </View>
            <Text style={styles.ajudaTitulo}>Ajuda & Suporte</Text>
            <Text style={styles.ajudaSubtitulo}>
              Tens alguma dúvida? Contacta o técnico responsável pela LIA.
            </Text>

            {/* NOME */}
            <View style={styles.ajudaContacto}>
              <View style={[styles.ajudaContactoIcon, { backgroundColor: '#EDE7F6' }]}>
                <Ionicons name="person-outline" size={20} color="#5E35B1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ajudaContactoLabel}>Técnico</Text>
                <Text style={styles.ajudaContactoValor}>Orlando Morais</Text>
              </View>
            </View>

            {/* EMAIL */}
            <TouchableOpacity
              style={styles.ajudaContacto}
              onPress={() => Linking.openURL('mailto:omorais@estg.ipvc.pt')}
            >
              <View style={[styles.ajudaContactoIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="mail-outline" size={20} color="#005596" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ajudaContactoLabel}>Email</Text>
                <Text style={styles.ajudaContactoValor}>omorais@estg.ipvc.pt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
            </TouchableOpacity>

            {/* TELEMÓVEL */}
            <TouchableOpacity
              style={styles.ajudaContacto}
              onPress={() => Linking.openURL('tel:+351912345678')}
            >
              <View style={[styles.ajudaContactoIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="call-outline" size={20} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ajudaContactoLabel}>Telemóvel</Text>
                <Text style={styles.ajudaContactoValor}>258919700</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.ajudaFechar, { marginTop: 10 }]} onPress={() => setModalAjuda(false)}>
              <Text style={styles.ajudaFecharText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBackground: { backgroundColor: '#065294', alignItems: 'center', paddingTop: 40, paddingBottom: 70, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#337BB5', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: '#065294', overflow: 'hidden' },
  imageAvatar: { width: 80, height: 80, borderRadius: 40 }, 
  avatarTextBig: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  emailText: { fontSize: 14, color: '#E0E0E0', marginBottom: 12 },
  roleBadge: { backgroundColor: '#1E6CA8', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  roleText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  statsCard: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, paddingVertical: 20, marginTop: -40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F0F0F0', height: '80%', alignSelf: 'center' },
  statNumberBlue: { fontSize: 22, fontWeight: 'bold', color: '#065294', marginBottom: 4 },
  statNumberGreen: { fontSize: 22, fontWeight: 'bold', color: '#00BFA5', marginBottom: 4 },
  statNumberDark: { fontSize: 22, fontWeight: 'bold', color: '#424242', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  menuContainer: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 25, borderRadius: 16, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600' },
  espacadorMenu: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20, marginVertical: 5 },
  ajudaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  ajudaContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  ajudaIconCirculo: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  ajudaTitulo: { fontSize: 20, fontWeight: 'bold', color: '#212121', marginBottom: 6 },
  ajudaSubtitulo: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  ajudaContacto: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, width: '100%', marginBottom: 10 },
  ajudaContactoIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ajudaContactoLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  ajudaContactoValor: { fontSize: 15, color: '#212121', fontWeight: '600', marginTop: 2 },
  ajudaFechar: { backgroundColor: '#005596', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  ajudaFecharText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});