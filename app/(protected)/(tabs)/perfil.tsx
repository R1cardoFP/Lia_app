import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../services/api';


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



  useFocusEffect(
    useCallback(() => {
      if (user) {
        processarDadosUtilizador();
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
            <Text style={styles.statNumberBlue}>12</Text>
            <Text style={styles.statLabel}>Reservas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumberGreen}>1</Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumberDark}>8</Text>
            <Text style={styles.statLabel}>Itens usados</Text>
          </View>
        </View>

        {/* --- LISTA DE OPÇÕES --- */}
        <View style={styles.menuContainer}>
          <OpcaoMenu icone="time-outline" titulo="Histórico de Requisições" onPress={() => console.log('Ir para histórico')} />
          <OpcaoMenu icone="person-outline" titulo="Editar perfil" onPress={() => router.push('/editar-perfil')} />
          <OpcaoMenu icone="help-circle-outline" titulo="Ajuda & Suporte" onPress={() => console.log('Ir para ajuda')} />
          <View style={styles.espacadorMenu} />
          <OpcaoMenu icone="log-out-outline" titulo="Terminar sessão" corTexto="#E53935" corIcone="#E53935" fundoIcone="#FFEBEE" onPress={handleLogout} />
        </View>

      </ScrollView>
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
});