import api from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ItemReservado = {
  id: number;
  name: string;
  model: string;
  category: string;
};

type KitReservado = {
  id: number;
  name: string;
  description: string;
};

type DetalheReserva = {
  id: number;
  reserve_state_id: number;
  start_date: string;
  end_date: string;
  items: ItemReservado[];
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
        return { texto: 'concluida', sc: 'rgba(0, 163, 133, 0.12)', tc: '#00a385' };
      case 6:
        return { texto: 'Concluída', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
      case 8:
        return { texto: 'devolvido', sc: 'rgba(0, 163, 133, 0.12)', tc: '#00a385' };
      case 9:
        return { texto: 'Devolvido (Fora do Prazo)', sc: 'rgba(0, 163, 133, 0.12)', tc: '#00a385' };
      case 3:
        return { texto: 'recusada', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };
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
      </View>
    );
  }

  const uiStatus = getStatusStyles(reserva.reserve_state_id);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Botão de Voltar */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

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
      </View>

      {/* Itens Isolados */}
      {reserva.items && reserva.items.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ITENS INDIVIDUAIS</Text>
          {reserva.items.map((item) => (
            <View key={`item-${item.id}`} style={styles.cardEquipamento}>
              <View style={styles.detalhesEquipamento}>
                <Text style={styles.nomeEquipamento} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.infoMeta}>Modelo: <Text style={styles.infoMetaValor}>{item.model}</Text></Text>
                <Text style={styles.infoMeta}>Categoria: <Text style={styles.infoMetaValor}>{item.category}</Text></Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Kits Reservados */}
      {reserva.kits && reserva.kits.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>KITS DE EQUIPAMENTO</Text>
          {reserva.kits.map((kit) => (
            <View key={`kit-${kit.id}`} style={styles.cardEquipamento}>
              <View style={styles.detalhesEquipamento}>
                <Text style={styles.nomeEquipamento} numberOfLines={1}>{kit.name}</Text>
                <Text style={styles.descricaoKit} numberOfLines={2}>
                  {kit.description || "Sem descrição disponível para este kit."}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f7fc' 
  },
  containerLoading: { 
    flex: 1, 
    backgroundColor: '#f4f7fc', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#7a94aa',
    fontSize: 14,
    textAlign: 'center'
  },
  navHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4
  },
  backButtonText: {
    color: '#065294',
    fontSize: 14,
    fontWeight: '600'
  },
  cardInfoPrincipal: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eaf0f8'
  },
  labelSecundario: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a9fb4',
    letterSpacing: 0.5
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6
  },
  tituloDataTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0d1f30'
  },
  textoDataReal: {
    fontSize: 13,
    color: '#3a5068',
    fontWeight: '500',
    marginTop: 4
  },
  sectionContainer: {
    paddingHorizontal: 14,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3a5068',
    letterSpacing: 0.4,
    marginBottom: 10
  },
  cardEquipamento: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eaf0f8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detalhesEquipamento: {
    flex: 1,
    justifyContent: 'center'
  },
  nomeEquipamento: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0d1f30',
    marginBottom: 4
  },
  infoMeta: {
    fontSize: 11,
    color: '#8a9fb4',
    marginTop: 2
  },
  infoMetaValor: {
    color: '#3a5068',
    fontWeight: '600'
  },
  descricaoKit: {
    fontSize: 12,
    color: '#5a7a9a',
    lineHeight: 16,
    marginTop: 2
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 85,
    alignItems: 'center'
  },
  badgeText: { 
    fontSize: 10, 
    fontWeight: '700',
    textTransform: 'lowercase'
  }
});