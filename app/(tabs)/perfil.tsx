import { Ionicons } from '@expo/vector-icons'; // Ícones nativos do Expo
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Perfil() {
  const [userName, setUserName] = useState('Carregando...');
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    carregarDadosUtilizador();
  }, []);

  const carregarDadosUtilizador = async () => {
    try {
      const nomeGuardado = await AsyncStorage.getItem('userName');
      if (nomeGuardado) {
        setUserName(nomeGuardado);
        
        const partesNome = nomeGuardado.trim().split(' ');
        if (partesNome.length > 1) {
          setUserInitials((partesNome[0][0] + partesNome[partesNome.length - 1][0]).toUpperCase());
        } else {
          setUserInitials(nomeGuardado.substring(0, 2).toUpperCase());
        }
      } else {
        setUserName('Utilizador LIA');
        setUserInitials('LI');
      }
    } catch (error) {
      console.log('Erro ao ler nome do AsyncStorage', error);
    }
  };

  // Função Real de Terminar Sessão
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
            // Apaga as chaves da memória
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userName');
            
            // Volta para a página de Login (substituindo a stack)
            router.replace('/login');
          }
        }
      ]
    );
  };

  // Componente reutilizável para cada linha do menu
  const OpcaoMenu = ({ icone, titulo, corIcone = '#546E7A', corTexto = '#212121', fundoIcone = '#F5F5F5', onPress }) => (
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
            <Text style={styles.avatarTextBig}>{userInitials}</Text>
          </View>
          <Text style={styles.nameText}>{userName}</Text>
          {/* Email temporário, podes buscar à API depois se quiseres */}
          <Text style={styles.emailText}>estudante@ipvc.pt</Text> 
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Estudante</Text>
          </View>
        </View>

        {/* --- CARTÃO DE ESTATÍSTICAS (SOBREPOSTO) --- */}
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
          <OpcaoMenu 
            icone="time-outline" 
            titulo="Histórico de Requisições" 
            onPress={() => console.log('Ir para histórico')} 
          />
          <OpcaoMenu 
            icone="person-outline" 
            titulo="Editar perfil" 
            onPress={() => console.log('Ir para editar perfil')} 
          />
          <OpcaoMenu 
            icone="help-circle-outline" 
            titulo="Ajuda & Suporte" 
            onPress={() => console.log('Ir para ajuda')} 
          />
          
          <View style={styles.espacadorMenu} />
          
          <OpcaoMenu 
            icone="log-out-outline" 
            titulo="Terminar sessão" 
            corTexto="#E53935" // Vermelho
            corIcone="#E53935"
            fundoIcone="#FFEBEE" // Fundo vermelho clarinho
            onPress={handleLogout} 
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header Azul
  headerBackground: {
    backgroundColor: '#005596', // O tom de azul do IPVC / Design
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 70, // Espaço extra para o cartão sobrepor
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#337BB5', // Azul um pouco mais claro para destacar
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#004780',
  },
  avatarTextBig: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#1E6CA8',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Cartão de Estatísticas
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    marginTop: -40, // É isto que faz a magia da sobreposição!
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    height: '80%',
    alignSelf: 'center',
  },
  statNumberBlue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#005596',
    marginBottom: 4,
  },
  statNumberGreen: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00BFA5',
    marginBottom: 4,
  },
  statNumberDark: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '500',
  },

  // Menu List
  menuContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 25,
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  espacadorMenu: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginVertical: 5,
  },
});