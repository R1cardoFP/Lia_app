import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from "../../../services/api";


type PivotData = {
  quantity: number;
};

type ItemReservado = {
  id: number;
  name?: string;
  nome?: string;
  model: string;
  category: string;
  pivot?: PivotData;
  quantity?: number;
};

type KitReservado = {
  id: number;
  name: string;
  description: string;
  pivot?: PivotData;
  quantity?: number;
};

type DetalheReserva = {
  id: number;
  description: string;
  reserve_state_id: number;
  start_date: string;
  end_date: string;
  items?: ItemReservado[];
  item_reserves?: any[]; // Fallback para a relação padrão do Laravel
  kits?: KitReservado[];
  kit_reserves?: any[];  // Fallback para a relação padrão do Laravel
};

export default function DetalheReservaPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [loading, setLoading] = useState(true);
  const [reserva, setReserva] = useState<DetalheReserva | null>(null);

  useEffect(() => {
    const fetchDetalheReserva = async () => {
      try {
        const response = await api.get(`/reservas/${id}`);
        if (response.data.status === 'success') {
          setReserva(response.data.data);
        }
      } catch (error: any) {
        console.log("Erro ao obter detalhes da reserva:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetalheReserva();
  }, [id]);

const handleCancelarReserva = () => {
    Alert.alert(
      "Cancelar Reserva",
      "Tens a certeza que queres cancelar este pedido? Os equipamentos deixarão de estar reservados para ti.",
      [
        { text: "Voltar Atrás", style: "cancel" },
        { text: "Sim, Cancelar", style: "destructive", onPress: submeterCancelamento }
      ]
    );
  };

  const submeterCancelamento = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Faz o pedido POST para a rota que acabámos de criar no Laravel
      const response = await api.post(`/reservas/${id}/cancelar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        // Atualiza o estado da UI imediatamente antes de saltar fora
        setReserva(prev => prev ? { ...prev, reserve_state_id: 10 } : null);

        Alert.alert("Cancelada", "A tua reserva foi cancelada com sucesso.", [
          { 
            text: "OK", 
            onPress: () => {
              router.replace('/(tabs)/reservas');
            } 
          }
        ]);
      }
    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || "Ocorreu um erro ao cancelar.";
      Alert.alert("Erro", mensagemErro);
    }
  };


  const getStatusStyles = (stateId: number) => {
    switch (stateId) {
      case 1:
        return { texto: 'pendente', sc: 'rgba(138, 159, 180, 0.15)', tc: '#5a7a9a' };
      case 2:
        return { texto: 'autorizada', sc: 'rgba(0, 163, 133, 0.12)', tc: '#00a385' };
      case 4:
        return { texto: 'Em Atraso', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      case 7:
        return { texto: 'entregue', sc: 'rgba(0, 163, 133, 0.12)', tc: '#00a385' };
      case 5:
      case 6:
        return { texto: 'Concluída', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      case 8:
      case 9:
        return { texto: 'Devolvido', sc: 'rgba(0, 163, 133, 0.12)', tc: '#00a385' };
      case 3:
        return { texto: 'recusada', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      case 10:
        return { texto: 'cancelada', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      default:
        return { texto: 'Desconhecido', sc: '#e8f0f9', tc: '#5a7a9a' };
    }
  };

  const formatarDataCompleta = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return '---';
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Data inválida';

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(s.getDate())}/${pad(s.getMonth() + 1)}/${s.getFullYear()} até ${pad(e.getDate())}/${pad(e.getMonth() + 1)}/${e.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.containerLoading}>
        <ActivityIndicator size="large" color="#065294" />
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={styles.containerLoading}>
        <Text style={styles.errorText}>Não foi possível encontrar os dados desta reserva.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#065294', fontWeight: 'bold' }}>Voltar Atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const uiStatus = getStatusStyles(reserva.reserve_state_id);
  
  // Normalização das listas para lidar com os diferentes formatos que o Laravel pode enviar
  const listaItens = reserva.items || (reserva.item_reserves ? reserva.item_reserves.map(ir => ({ ...ir.item, quantity: ir.quantity })) : []);
  const listaKits = reserva.kits || (reserva.kit_reserves ? reserva.kit_reserves.map(kr => ({ ...kr.kit, quantity: kr.quantity })) : []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Botão de Voltar */}
      <Stack.Screen options={{ 
      title: `Reserva #${id}`, 
      headerShown: true,
      headerTitleAlign: 'center' 
    }} />

      {/* Bloco de Resumo Superior */}
      <View style={styles.cardInfoPrincipal}>
        <Text style={styles.labelSecundario}>RESERVA #{reserva.id}</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.tituloDataTitle}>Período de Alocação</Text>
          <View style={[styles.badge, { backgroundColor: uiStatus.sc, borderColor: uiStatus.tc }]}>
            <Text style={[styles.badgeText, { color: uiStatus.tc }]}>{uiStatus.texto}</Text>
          </View>
        </View>

        <Text style={styles.textoDataReal}>
          📅 {formatarDataCompleta(reserva.start_date, reserva.end_date)}
        </Text>

        {/* Motivo da Reserva */}
        <View style={styles.motivoContainer}>
          <Text style={styles.labelSecundario}>MOTIVO / JUSTIFICAÇÃO</Text>
          <Text style={styles.motivoTexto}>{reserva.description || 'Sem motivo especificado.'}</Text>
        </View>
      </View>

      {/* Itens Isolados */}
      {listaItens.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ITENS INDIVIDUAIS</Text>
          {listaItens.map((item: any, index: number) => {
            const quantidade = item.quantity || item.pivot?.quantity || 1;
            return (
              <View key={`item-${item.id}-${index}`} style={styles.cardEquipamento}>
                <View style={styles.detalhesEquipamento}>
                  <Text style={styles.nomeEquipamento} numberOfLines={1}>{item.name || item.nome}</Text>
                  <Text style={styles.infoMeta}>Modelo: <Text style={styles.infoMetaValor}>{item.model}</Text></Text>
                </View>
                {/* Badge de Quantidade */}
                <View style={styles.badgeQtd}>
                  <Text style={styles.badgeQtdText}>{quantidade}x</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Kits Reservados */}
      {listaKits.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>KITS DE EQUIPAMENTO</Text>
          {listaKits.map((kit: any, index: number) => {
            const quantidade = kit.quantity || kit.pivot?.quantity || 1;
            return (
              <View key={`kit-${kit.id}-${index}`} style={styles.cardEquipamento}>
                <View style={styles.detalhesEquipamento}>
                  <Text style={styles.nomeEquipamento} numberOfLines={1}>{kit.name || kit.nome}</Text>
                  <Text style={styles.descricaoKit} numberOfLines={2}>
                    {kit.description || "Sem descrição disponível."}
                  </Text>
                </View>
                {/* Badge de Quantidade */}
                <View style={styles.badgeQtd}>
                  <Text style={styles.badgeQtdText}>{quantidade}x</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {reserva.reserve_state_id === 1 && (
        <TouchableOpacity 
          style={styles.botaoCancelar} 
          onPress={handleCancelarReserva}
        >
          <Text style={styles.textoBotaoCancelar}>Cancelar Reserva</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fc' },
  containerLoading: { flex: 1, backgroundColor: '#f4f7fc', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#7a94aa', fontSize: 14, textAlign: 'center' },
  navHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  backButtonText: { color: '#065294', fontSize: 14, fontWeight: '600' },
  cardInfoPrincipal: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 14, marginTop: 8, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: '#eaf0f8' },
  labelSecundario: { fontSize: 11, fontWeight: '700', color: '#8a9fb4', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  tituloDataTitle: { fontSize: 18, fontWeight: '800', color: '#0d1f30' },
  textoDataReal: { fontSize: 13, color: '#3a5068', fontWeight: '500', marginTop: 4 },
  
  motivoContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eaf0f8' },
  motivoTexto: { fontSize: 14, color: '#3a5068', marginTop: 6, lineHeight: 20 },

  sectionContainer: { paddingHorizontal: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#3a5068', letterSpacing: 0.4, marginBottom: 10 },
  cardEquipamento: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#eaf0f8', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  detalhesEquipamento: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  nomeEquipamento: { fontSize: 14, fontWeight: '700', color: '#0d1f30', marginBottom: 4 },
  infoMeta: { fontSize: 11, color: '#8a9fb4', marginTop: 2 },
  infoMetaValor: { color: '#3a5068', fontWeight: '600' },
  descricaoKit: { fontSize: 12, color: '#5a7a9a', lineHeight: 16, marginTop: 2 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, minWidth: 85, alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  
  badgeQtd: { backgroundColor: '#f4f7fc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eaf0f8' },
  badgeQtdText: { color: '#065294', fontWeight: 'bold', fontSize: 14 },
  botaoCancelar: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 12, paddingVertical: 14, marginHorizontal: 14, marginTop: 20, alignItems: 'center' },
  textoBotaoCancelar: { color: '#c62828', fontSize: 15, fontWeight: 'bold' }
});