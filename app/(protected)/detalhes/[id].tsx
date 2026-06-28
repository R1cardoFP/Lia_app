import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReserva } from '../../../contexts/reservaContext';
import api, { API_URL } from '../../../services/api';


interface ItemCarrinho {
  id: string | number;
  is_kit: boolean;
  quantidadeSelecionada: number;
}

interface Reserva {
  dataInicio: string;
  dataFim: string;
  itens: ItemCarrinho[];
}

interface ContextoReservaProps {
  adicionarItem: (item: any, quantidade: number) => void;
  temReservaAtiva: boolean;
  reserva: Reserva;
}

export default function DetalhesEquipamento() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // CONSUMIR O ESTADO GLOBAL DA RESERVA
  const { adicionarItem, temReservaAtiva, reserva } = useReserva() as ContextoReservaProps;
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado local para controlar a quantidade que o utilizador quer levar
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  // Se o item já estiver no carrinho, começa com a quantidade que estava lá guardada
  useEffect(() => {
    if (item && temReservaAtiva) {
      const itemNoCarrinho = reserva.itens.find((i: ItemCarrinho) => i.id === item.id && i.is_kit === item.is_kit);
      if (itemNoCarrinho) {
        setQuantidadeSelecionada(itemNoCarrinho.quantidadeSelecionada);
      }
    }
  }, [item]);

  const carregarDetalhes = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      let endpoint = `/item/${id}`;

      if (temReservaAtiva) {
        endpoint += `?start_date=${reserva.dataInicio}&end_date=${reserva.dataFim}`;
      }

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setItem(response.data.data);
      }
    } catch (error) {
      console.log('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarAoCarrinho = () => {
    if (item.quantidade === 0) {
      Alert.alert('Indisponível', 'Não existem unidades disponíveis deste equipamento para as datas selecionadas.');
      return;
    }

    // Adiciona o item com a quantidade escolhida ao Contexto Global
    adicionarItem(item, quantidadeSelecionada);
    
    Alert.alert(
      'Adicionado!', 
      `${item.nome} adicionado à tua reserva.`,
      [
        { text: 'Continuar a Escolher', onPress: () => router.push('/catalogo') },
        { text: 'Ver Reserva', onPress: () => router.push('/fazer-reserva') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#005596" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Equipamento não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#005596' }}>Voltar atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.containerPrincipal}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
        <View style={styles.imageContainer}>
          <TouchableOpacity 
            style={[styles.backButton, { top: Math.max(insets.top + 10, 40) }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {item.image ? (
            <Image source={{ uri: `${API_URL}/${item.image}` }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="camera-outline" size={60} color="#9E9E9E" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.tituloRow}>
            <Text style={styles.nomeItem}>{item.nome || 'Equipamento'}</Text>
            <View style={[styles.badgeDisponivel, item.quantidade === 0 && { backgroundColor: '#FFEBEE' }]}>
              <Text style={[
                styles.badgeText, 
                item.quantidade === 0 && { color: '#c05060' }
              ]}>
                {item.quantidade === 0 ? 'Esgotado' : `${item.quantidade} Unid.`}
              </Text>
            </View>
          </View>
          
          <Text style={styles.modeloItem}>Modelo: {item.model || 'N/A'}</Text>
          
          <View style={styles.divider} />

          <View style={styles.detalheRow}>
            <Ionicons name="folder-open-outline" size={20} color="#546E7A" />
            <Text style={styles.detalheTexto}>Categoria: {item.categoria || 'Geral'}</Text>
          </View>

          <View style={styles.detalheRow}>
            <Ionicons name="information-circle-outline" size={20} color="#546E7A" />
            <Text style={styles.detalheTexto}>Observação: {item.observacao || 'Sem observações'}</Text>
          </View>

          <Text style={styles.seccaoTitulo}>Acessórios</Text>
          <Text style={styles.descricaoTexto}>{item.acessorios || 'Sem acessórios listados.'}</Text>

          <View style={styles.divider} />
          <Text style={styles.seccaoTitulo}>Disponibilidade</Text>
          
          <View style={styles.calendarioContainer}>
            <Calendar
              theme={{
                todayTextColor: '#005596',
                arrowColor: '#005596',
                textMonthFontWeight: 'bold',
              }}
            />
          </View>
          <Text style={styles.calendarioNota}>Os dias ocupados na base de dados aparecerão marcados no calendário.</Text>

          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* --- BOTTOM BAR INTELIGENTE --- */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <View>
          <Text style={styles.precoLabel}>Preço Estimado</Text>
          <Text style={styles.precoValor}>{item.preco || '20,00'} € / dia</Text>
        </View>

        {temReservaAtiva ? (
          // INTERFACE SE TIVER RESERVA ATIVA: SELETOR + BOTAO ADICIONAR
          <View style={styles.containerAcoesReserva}>
            <View style={styles.stepperContainer}>
              <TouchableOpacity 
                style={styles.stepperBtn} 
                onPress={() => setQuantidadeSelecionada(q => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={18} color="#065294" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantidadeSelecionada}</Text>
              <TouchableOpacity 
                style={styles.stepperBtn} 
                onPress={() => setQuantidadeSelecionada(q => Math.min(item.quantidade, q + 1))}
              >
                <Ionicons name="add" size={18} color="#065294" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnReservar} onPress={handleAdicionarAoCarrinho}>
              <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnReservarText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // SE NÃO HOUVER RESERVA, BOTÃO SIMPLES QUE LEMBRA QUE É PRECISO DEFINIR DATAS
          <TouchableOpacity 
            style={[styles.btnReservar, { backgroundColor: '#757575' }]} 
            onPress={() => {
              Alert.alert('Nova Reserva', 'Para requisitar este item, por favor inicia uma nova sessão de reserva indicando o período.', [
                { text: 'Ir para Reservar', onPress: () => router.push('/fazer-reserva') },
                { text: 'Cancelar', style: 'cancel' }
              ]);
            }}
          >
            <Text style={styles.btnReservarText}>Fazer Reserva</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerPrincipal: { flex: 1, backgroundColor: '#FFF' },
  scrollArea: { flex: 1 },
  imageContainer: { width: '100%', height: 320, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFF', marginTop: -30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  tituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  nomeItem: { fontSize: 22, fontWeight: 'bold', color: '#212121', flex: 1, marginRight: 10 },
  badgeDisponivel: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
  modeloItem: { fontSize: 16, color: '#757575', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 20 },
  detalheRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detalheTexto: { fontSize: 15, color: '#424242', marginLeft: 10, flex: 1 },
  seccaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 10, marginTop: 10 },
  descricaoTexto: { fontSize: 15, color: '#616161', lineHeight: 22 },
  calendarioContainer: { borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  calendarioNota: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginTop: 15, fontStyle: 'italic' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEEEEE', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  precoLabel: { fontSize: 13, color: '#757575', marginBottom: 2 },
  precoValor: { fontSize: 20, fontWeight: 'bold', color: '#065294' },
  
  containerAcoesReserva: { flexDirection: 'row', alignItems: 'center' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 10, padding: 4, marginRight: 12 },
  stepperBtn: { width: 32, height: 32, backgroundColor: '#FFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  stepperValue: { fontSize: 16, fontWeight: 'bold', color: '#212121', paddingHorizontal: 15 },
  
  btnReservar: { backgroundColor: '#065294', flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, alignItems: 'center', height: 44 },
  btnReservarText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});