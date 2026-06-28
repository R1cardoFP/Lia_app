import api from "@/services/api";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Reserva = {
  id: number;
  reserve_state_id: number; 
  start_date: string;    
  end_date: string;      
  item_name?: string;    
  reserve_state?: { name: string }; 
};

export default function Reservas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtro, setFiltro] = useState('Todas');

  const fetchReservas = async () => {
    try {
      const response = await api.get('/reservas/historico');
      if (response.data.status === 'success') {
        setReservas(response.data.data);
      }
    } catch (error: any) {
      console.log("Erro ao ir buscar as reservas:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservas();
  };

  
  const getStatusStyles = (stateId: number) => {
    switch (stateId) {

      case 1: // Pendente
        return { grupo: 'Ativas', texto: 'Pendente', sc: '#F0F0F0', tc: '#9E9E9E' }; // Cinzento claro / Cinzento escuro
      
      case 2: // Autorizada
        return { grupo: 'Ativas', texto: 'Autorizada', sc: '#E8F5E9', tc: '#2E7D32' }; // Verde claro / Verde forte
      
      case 4: // Em Atraso
        return { grupo: 'Ativas', texto: 'Em atraso', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' }; // Vermelho claro / Vermelho forte
      
      case 7: // Material Entregue ao Reservante
        return { grupo: 'Ativas', texto: 'Entregue', sc: '#E8F5E9', tc: '#2E7D32' }; // Verde

      case 5: // Concluída
        return { grupo: 'Concluídas', texto: 'Concluida', sc: '#E8F5E9', tc: '#2E7D32' }; // Verde
      
      case 6: // Concluída Fora de Prazo
        return { grupo: 'Concluídas', texto: 'Concluída', sc: '#E8F5E9', tc: '#2E7D32' }; // Vermelho
      
      case 8: // Material Devolvido
        return { grupo: 'Concluídas', texto: 'Devolvido', sc: '#E8F5E9', tc: '#2E7D32' }; // Verde
      
      case 9: // Material Devolvido Fora do Prazo
        return { grupo: 'Concluídas', texto: 'Devolvido (Fora do Prazo)', sc: '#E8F5E9', tc: '#2E7D32' }; // Verde

      case 3: // Não Autorizada
        return { grupo: 'Recusadas', texto: 'Recusada', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' }; 
      case 10:
      return { texto: 'Cancelada', sc: 'rgba(192, 80, 96, 0.12)', tc: '#c05060' };

      default:
        return { grupo: 'Todas', texto: 'Desconhecido', sc: '#F0F0F0', tc: '#9E9E9E' };
    }
  };
  const formatarDataLateral = (dataString: string) => {
    if (!dataString) return { dia: '00', mes: '---' };
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return { dia: '00', mes: '---' };

    const dia = data.getDate().toString().padStart(2, '0');
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const mes = meses[data.getMonth()];

    return { dia, mes };
  };

  const formatarPeriodoTexto = (start: string, end: string) => {
    if (!start || !end) return 'Data indefinida';
    const dStart = new Date(start);
    const dEnd = new Date(end);
    
    if (isNaN(dStart.getTime()) || !dEnd.getTime()) return 'Data inválida';

    const mesesExtenso = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    if (dStart.getMonth() === dEnd.getMonth()) {
      return `${dStart.getDate()}–${dEnd.getDate()} ${mesesExtenso[dStart.getMonth()]} ${dStart.getFullYear()}`;
    }
    
    return `${dStart.getDate()} ${mesesExtenso[dStart.getMonth()]} – ${dEnd.getDate()} ${mesesExtenso[dEnd.getMonth()]}`;
  };

  const reservasFiltradas = reservas.filter(r => {
    const ui = getStatusStyles(r.reserve_state_id);
    return filtro === 'Todas' || ui.grupo === filtro;
  });

  const totalReservas = reservas.length;
  const ativasAgora = reservas.filter(r => getStatusStyles(r.reserve_state_id).grupo === 'Ativas').length;

  if (loading) {
    return (
      <View style={styles.containerLoading}>
        <ActivityIndicator size="large" color="#065294" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#065294']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reservas</Text>
        <Text style={styles.headerSubtitle}>Histórico de requisições</Text>
        
        {/* Filtros / Chips com "Recusadas" */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          {['Todas', 'Ativas', 'Concluídas', 'Recusadas'].map((item) => (
            <TouchableOpacity 
              key={item} 
              style={[styles.chip, filtro === item && styles.chipActive]} 
              onPress={() => setFiltro(item)}
            >
              <Text style={[styles.chipText, filtro === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cards de Estatísticas Reais */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.bgTotal]}>
          <Text style={styles.statNumber}>{totalReservas}</Text>
          <Text style={styles.statLabel}>Total de reservas</Text>
        </View>
        <View style={[styles.statCard, styles.bgAtivas]}>
          <Text style={styles.statNumber}>{ativasAgora}</Text>
          <Text style={styles.statLabel}>Ativas agora</Text>
        </View>
      </View>

      {/* Lista de Requisições */}
      <View style={styles.listaContainer}>
        <Text style={styles.listaTitle}>TODAS AS REQUISIÇÕES</Text>
        
        {reservasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma reserva encontrada para este filtro.</Text>
          </View>
        ) : (
          reservasFiltradas.map((r) => {
            const uiStatus = getStatusStyles(r.reserve_state_id);
            const { dia, mes } = formatarDataLateral(r.start_date);
            const periodoTexto = formatarPeriodoTexto(r.start_date, r.end_date);

            return (
              <TouchableOpacity 
                  key={r.id} 
                  style={styles.itemCard}
                  onPress={() => router.push(`/(protected)/verReserva/${r.id}`)}
                >
                {/* Bloco de Data Dinâmico */}
                <View style={styles.dateBlock}>
                  <Text style={styles.dateMonth}>{mes}</Text>
                  <Text style={styles.dateDay}>{dia}</Text>
                </View>

                {/* Divisor vertical */}
                <View style={styles.divider} />

                {/* Ícone customizado baseado no status */}
                <View style={styles.iconContainer}>

                </View>

                {/* Informações da BD */}
                <View style={styles.infoContainer}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {r.item_name || "Equipamento/Kit"}
                  </Text>
                  <Text style={styles.itemDate}>{periodoTexto}</Text>
                </View>

                {/* Badge de Status Dinâmico */}
                <View style={[styles.badge, { backgroundColor: uiStatus.sc }]}>
                  <Text style={[styles.badgeText, { color: uiStatus.tc }]}>{uiStatus.texto}</Text>
                </View>
                
              </TouchableOpacity>
            );
          })
        )}
      </View>
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
    alignItems: 'center' 
  },
  header: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingTop: 20, 
    paddingBottom: 12 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0d1f30' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: '#7a94aa', 
    marginTop: 2 
  },
  chipsContainer: { 
    flexDirection: 'row', 
    marginTop: 12 
  },
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: '#f0f3f8', 
    marginRight: 8 
  },
  chipActive: { 
    backgroundColor: '#065294' 
  },
  chipText: { 
    fontSize: 12, 
    color: '#5a7a9a', 
    fontWeight: '600' 
  },
  chipTextActive: { 
    color: '#fff' 
  },
  statsContainer: { 
    flexDirection: 'row', 
    gap: 10, 
    padding: 14 
  },
  statCard: { 
    flex: 1, 
    borderRadius: 14, 
    padding: 14 
  },
  bgTotal: { 
    backgroundColor: '#065294' 
  },
  bgAtivas: { 
    backgroundColor: '#00a385' 
  },
  statNumber: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#fff' 
  },
  statLabel: { 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.7)', 
    marginTop: 2 
  },
  listaContainer: { 
    paddingHorizontal: 14, 
    paddingBottom: 20 
  },
  listaTitle: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#3a5068', 
    letterSpacing: 0.3, 
    marginBottom: 10 
  },
  itemCard: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#eaf0f8', 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  dateBlock: { 
    width: 42, 
    alignItems: 'center' 
  },
  dateMonth: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: '#00a385', 
    letterSpacing: 0.3 
  },
  dateDay: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0d1f30', 
    lineHeight: 22 
  },
  divider: { 
    width: 1.5, 
    backgroundColor: '#eaf0f8', 
    alignSelf: 'stretch', 
    marginHorizontal: 4 
  },
  iconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#f0f5fa', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 6, 
    marginRight: 10 
  },
  iconEmoji: { 
    fontSize: 16 
  },
  infoContainer: { 
    flex: 1 
  },
  itemName: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#0d1f30' 
  },
  itemDate: { 
    fontSize: 11, 
    color: '#8a9fb4', 
    marginTop: 1 
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    minWidth: 74,
    alignItems: 'center'
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '600' 
  },
  emptyContainer: { 
    padding: 20, 
    alignItems: 'center' 
  },
  emptyText: { 
    color: '#7a94aa', 
    fontSize: 13, 
    textAlign: 'center' 
  }
});