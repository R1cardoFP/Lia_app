import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { API_URL } from "../../../services/api";

type ItemReservado = {
  id: number;
  nome: string;
  model: string;
  image?: string;
  quantidade: number;
  price_day: number;
};

type KitReservado = {
  id: number;
  nome: string;
  description: string;
  image?: string;
  quantidade: number;
  price_day: number;
};

type DetalheReserva = {
  id: number;
  reserve_state_id: number;
  description: string;
  estado: string;
  start_date: string;
  end_date: string;
  cost: number | string;
  is_paid: number;
  ciclica_id?: number | null;
  itens: ItemReservado[];
  kits: KitReservado[];
};



export default function DetalheReservaPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [loading, setLoading] = useState(true);
  const [reserva, setReserva] = useState<DetalheReserva | null>(null);

  useEffect(() => {
    const fetchDetalheReserva = async () => {
      try {
        setLoading(true);
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
      // Pedido simplificado utilizando a configuração global da tua instância da API
      const response = await api.post(`/reservas/${id}/cancelar`, {});

      if (response.data.status === 'success') {
        setReserva(prev => prev ? { ...prev, reserve_state_id: 10 } : null);

        Alert.alert("Cancelada", "A tua reserva foi cancelada com sucesso.", [
          { 
            text: "OK", 
            onPress: () => {
              router.replace('(tabs)/reservas');
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
        return { texto: 'Pendente', sc: '#F0F0F0', tc: '#9E9E9E' };
      case 2: 
        return { texto: 'Autorizada', sc: '#E8F5E9', tc: '#2E7D32' };
      case 3: 
        return { texto: 'Recusada', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      case 4: 
        return { texto: 'Em atraso', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      case 5: 
      case 6: 
        return { texto: 'Concluída', sc: '#E8F5E9', tc: '#2E7D32' };
      case 7: 
        return { texto: 'Entregue', sc: '#E8F5E9', tc: '#2E7D32' };
      case 8: 
        return { texto: 'Devolvido', sc: '#E8F5E9', tc: '#2E7D32' };
      case 9: 
        return { texto: 'Devolvido (Fora do Prazo)', sc: '#E8F5E9', tc: '#2E7D32' };
      case 10:
        return { texto: 'Cancelada', sc: '#F0F0F0', tc: '#9E9E9E' };
      default:
        return { texto: 'Desconhecido', sc: '#F0F0F0', tc: '#9E9E9E' };
    }
  };

  const obterUrlImagem = (caminho?: string | null): string | undefined => {
    if (!caminho) return undefined;
    return `${API_URL}/${caminho.startsWith('/') ? caminho.substring(1) : caminho}`;
  };

  const formatarDataCompleta = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return '---';
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Data inválida';

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(s.getDate())}/${pad(s.getMonth() + 1)}/${s.getFullYear()} até ${pad(e.getDate())}/${pad(e.getMonth() + 1)}/${e.getFullYear()}`;
  };

  const obterDiaCiclico = (ciclicaId?: number | null): string | null => {
    // 1 (ou null) = não cíclica. 2=Domingo ... 8=Sábado
    if (!ciclicaId || ciclicaId === 1) return null;
    const dias: Record<number, string> = {
      2: 'Domingos',
      3: 'Segundas-feiras',
      4: 'Terças-feiras',
      5: 'Quartas-feiras',
      6: 'Quintas-feiras',
      7: 'Sextas-feiras',
      8: 'Sábados',
    };
    return dias[ciclicaId] || null;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
          
          {/* Bloco de Títulos (coluna) */}
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.headerTitle}>Reserva</Text>
            <Text style={styles.headerSubtitle}>Detalhes da requisição</Text>
          </View>

          {/* Botão Cancelar condicional movido para o Header */}
          {reserva.reserve_state_id === 1 && (
            <TouchableOpacity 
              style={styles.btnLimparTudo} 
              onPress={handleCancelarReserva}
            >
              <Text style={styles.btnLimparTudoText}>Cancelar</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>

      {/* Corpo com Scroll */}
      <View style={styles.corpoConteudo}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

          <View style={styles.avisoIpvcContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#00a385" style={{ marginRight: 10 }} />
          <Text style={styles.avisoIpvcTexto}>
            As reservas são totalmente isentas de custos para os alunos do IPVC.
          </Text>
        </View>
          
          {/* Card Info Principal */}
          <View style={styles.cardInfoPrincipal}>
            <View style={styles.statusRow}>
              <Text style={styles.tituloDataTitle}>Período de Alocação</Text>
              {(() => {
                const uiStatus = getStatusStyles(reserva.reserve_state_id);
                return (
                  <View style={[styles.badge, { backgroundColor: uiStatus.sc }]}>
                    <Text style={[styles.badgeText, { color: uiStatus.tc }]}>
                      {uiStatus.texto}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <Text style={styles.textoDataReal}>
              {formatarDataCompleta(reserva.start_date, reserva.end_date)}
            </Text>

               {obterDiaCiclico(reserva.ciclica_id) && (
              <View style={styles.ciclicaBadge}>
                <Ionicons name="repeat" size={15} color="#065294" />
                <Text style={styles.ciclicaTexto}>
                  Reserva cíclica · Todas as {obterDiaCiclico(reserva.ciclica_id)}
                </Text>
              </View>
            )}

            <View style={styles.motivoContainer}>
              <Text style={styles.labelSecundario}>MOTIVO / JUSTIFICAÇÃO</Text>
              <Text style={styles.motivoTexto}>{reserva.description || 'Sem motivo especificado.'}</Text>
            </View>
          </View>

          {/* Equipamentos Reservados */}
          {reserva.itens && reserva.itens.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>ITENS RESERVADOS</Text>
              {reserva.itens.map((item, index) => (
                <TouchableHighlight 
                  key={`item-${item.id}-${index}`} 
                  style={styles.cardLista}
                  underlayColor="#E8EAF6"
                  onPress={() => router.push(`/(protected)/detalhes/${item.id}`)}
                >
                  <View style={styles.cardContentInternal}>
                    {item.image ? (
                      <Image source={{ uri: obterUrlImagem(item.image) }} style={styles.imagemListaMock} />
                    ) : (
                      <View style={[styles.imagemListaMock, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                        <Ionicons name="camera-outline" size={24} color="#B0BEC5" />
                      </View>
                    )}

                    <View style={styles.listaTextoInfo}>
                      <Text style={styles.cardTitulo} numberOfLines={1}>{item.nome}</Text>
                      <Text style={styles.cardSubtitulo} numberOfLines={1}>{item.model}</Text>
                      <Text style={styles.textoPreco}>{Number(item.price_day).toFixed(2)}€ / dia</Text>
                    </View>

                    <View style={styles.badgeQtd}>
                      <Text style={styles.badgeQtdText}>{item.quantidade}x</Text>
                    </View>
                  </View>
                </TouchableHighlight>
              ))}
            </View>
          )}

          {/* Kits Reservados */}
          {reserva.kits && reserva.kits.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>KITS RESERVADOS</Text>
              {reserva.kits.map((kit, index) => (
                <TouchableHighlight 
                  key={`kit-${kit.id}-${index}`} 
                  style={styles.cardLista}
                  underlayColor="#E8EAF6"
                  onPress={() => router.push(`/(protected)/detalhes/${kit.id}`)}
                >
                  <View style={styles.cardContentInternal}>
                    {kit.image ? (
                      <Image source={{ uri: obterUrlImagem(kit.image) }} style={styles.imagemListaMock} />
                    ) : (
                      <View style={[styles.imagemListaMock, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                        <Ionicons name="camera-outline" size={24} color="#B0BEC5" />
                      </View>
                    )}

                    <View style={styles.listaTextoInfo}>
                      <Text style={styles.cardTitulo} numberOfLines={1}>{kit.nome}</Text>
                      <Text style={styles.cardSubtitulo} numberOfLines={1}>{kit.description || 'Sem descrição.'}</Text>
                      <Text style={styles.textoPreco}>{Number(kit.price_day).toFixed(2)}€ / dia</Text>
                    </View>

                    {/* Corrigido: Agora usa a variável local 'kit.quantidade' da iteração */}
                    <View style={styles.badgeQtd}>
                      <Text style={styles.badgeQtdText}>{kit.quantidade}x</Text>
                    </View>
                  </View>
                </TouchableHighlight>
              ))}
            </View>
          )}


          <View style={{ height: 40 }} />
        </ScrollView>
      </View>


      <View style={styles.bottomBar}>
  <View>
    <Text style={styles.precoLabel}>Custo Total da Reserva</Text>
    <Text style={styles.precoValor}>
      {reserva.estimated_cost ? Number(reserva.estimated_cost).toFixed(2) : '0.00'} €
    </Text>
  </View>
</View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 13, flexDirection: 'row', },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0d1f30' },
  headerSubtitle: { fontSize: 12, color: '#7a94aa', marginTop: 2 },
  btnLimparTudo: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    backgroundColor: '#FFEBEE',  
    borderWidth: 1, 
    borderColor: '#ffcdd2', 
  },
  btnLimparTudoText: { 
    color: '#E53935', 
    fontWeight: 'bold', 
    fontSize: 13 
  },
  backButton: { marginRight: 4, justifyContent: 'center', alignItems: 'center' },
  corpoConteudo: { flex: 1, backgroundColor: '#f4f7fc' },
  containerLoading: { flex: 1, backgroundColor: '#f4f7fc', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#7a94aa', fontSize: 14, textAlign: 'center' },
  cardLista: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginBottom: 10, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
    overflow: 'hidden'
  },
  
  cardContentInternal: { flexDirection: 'row', alignItems: 'center', padding: 12, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minWidth: 74, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardInfoPrincipal: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginTop: 15, marginBottom: 15, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  labelSecundario: { fontSize: 11, fontWeight: '700', color: '#8a9fb4', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  tituloDataTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
  textoDataReal: { fontSize: 13, color: '#5a7a9a', fontWeight: '500', marginTop: 4 },
  motivoContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  motivoTexto: { fontSize: 14, color: '#212121', marginTop: 6, lineHeight: 20 },
  sectionContainer: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', marginHorizontal: 20, marginBottom: 12, letterSpacing: 0.5 },
  imagemListaMock: { width: 65, height: 65, backgroundColor: '#E8EAF6', borderRadius: 12, marginRight: 15 },
  listaTextoInfo: { flex: 1, justifyContent: 'center' },
  cardTitulo: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 2 },
  cardSubtitulo: { fontSize: 12, color: '#757575', marginBottom: 4 },
  textoPreco: { fontSize: 12, fontWeight: '700', color: '#065294' },
  badgeQtd: { backgroundColor: '#f4f7fc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eaf0f8' },
  badgeQtdText: { color: '#065294', fontWeight: 'bold', fontSize: 14 },
  botaoCancelar: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 12, paddingVertical: 14, marginHorizontal: 20, marginTop: 10, alignItems: 'center' },
  textoBotaoCancelar: { color: '#c62828', fontSize: 15, fontWeight: 'bold' },
  ciclicaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#eaf0f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  ciclicaTexto: { fontSize: 12.5, fontWeight: '600', color: '#065294' },
  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFF', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 50, // Ajustado para dar um respiro confortável em ecrãs com notch inferior
    borderTopWidth: 1, 
    borderTopColor: '#EEEEEE', 
    elevation: 15, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  precoLabel: { fontSize: 13, color: '#757575', marginBottom: 2 },
  precoValor: { fontSize: 22, fontWeight: 'bold', color: '#065294' },

  avisoIpvcContainer: {
  flexDirection: 'row',
  backgroundColor: 'rgba(0, 163, 133, 0.12)', 
  marginHorizontal: 20,
  marginTop: 15,
  padding: 12,
  borderRadius: 12,
  alignItems: 'center',
},
avisoIpvcTexto: {
  color: '#00a385', 
  fontSize: 13,
  fontWeight: '600', 
  flex: 1, 
  lineHeight: 18,
},
});