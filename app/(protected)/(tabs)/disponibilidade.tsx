import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../services/api';

// Calendário em Português
LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt';

export default function Disponibilidade() {
  const [horarios, setHorarios] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarDisponibilidade();
    }, [])
  );

  const carregarDisponibilidade = async () => {
    try {
      setLoading(true);
      const response = await api.get('/disponibilidade');
      if (response.data.status === 'success') {
        const mapa: Record<string, string> = {};
        response.data.data.forEach((h: any) => { mapa[h.data] = h.descricao; });
        setHorarios(mapa);
      }
    } catch (err) {
      console.log('Erro ao carregar disponibilidade:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataLonga = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const nomeDia = LocaleConfig.locales['pt'].dayNames[d.getDay()];
    const [a, m, dd] = dateStr.split('-');
    return `${nomeDia}, ${dd}/${m}/${a}`;
  };

  const dataCurta = (dateStr: string) => dateStr.split('-').reverse().join('/');

  // Próximo dia disponível (hoje ou futuro)
  const hoje = new Date().toISOString().split('T')[0];
  const proximoDia = Object.keys(horarios).filter(d => d >= hoje).sort()[0] || null;

  // Marca a verde os dias com disponibilidade
  const datasMarcadas: any = Object.keys(horarios).reduce((acc: any, data) => {
    acc[data] = {
      customStyles: {
        container: { backgroundColor: '#E8F5E9', borderRadius: 8 },
        text: { color: '#2E7D32', fontWeight: 'bold' },
      },
    };
    return acc;
  }, {});

  // Realça o dia selecionado
  if (diaSelecionado) {
    const temHorario = !!horarios[diaSelecionado];
    datasMarcadas[diaSelecionado] = {
      customStyles: {
        container: { backgroundColor: temHorario ? '#2E7D32' : '#ECEFF1', borderRadius: 8 },
        text: { color: temHorario ? '#FFF' : '#212121', fontWeight: 'bold' },
      },
    };
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fc' }}>
        <ActivityIndicator size="large" color="#065294" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header fixo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Disponibilidade do Técnico</Text>
        <Text style={styles.headerSubtitle}>
          Consulta os horários para receber e devolver o material reservado
        </Text>
      </View>

      <View style={styles.corpoConteudo}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

          {/* Cartão: próximo horário disponível */}
          {proximoDia && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDiaSelecionado(proximoDia)}
              style={styles.proximoCard}
            >
              <View style={styles.proximoIcone}>
                <Ionicons name="calendar" size={22} color="#065294" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proximoLabel}>PRÓXIMO HORÁRIO</Text>
                <Text style={styles.proximoData}>{formatarDataLonga(proximoDia)}</Text>
                <Text style={styles.proximoHoras} numberOfLines={1}>{horarios[proximoDia]}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9bb0c4" />
            </TouchableOpacity>
          )}

          <Text style={styles.textoInformativo}>
            Toca num dia a verde para ver os horários.
          </Text>

          <View style={styles.calendarioContainer}>
            <Calendar
              markingType="custom"
              markedDates={datasMarcadas}
              onDayPress={(day) => setDiaSelecionado(day.dateString)}
              theme={{
                todayTextColor: '#065294',
                arrowColor: '#065294',
                textMonthFontWeight: 'bold',
              }}
            />
          </View>

          <View style={styles.legendaContainer}>
            <View style={styles.legendaDot} />
            <Text style={styles.legendaTexto}>Dia com disponibilidade</Text>
          </View>

          <Text style={styles.seccaoTitulo}>Horários</Text>
          <View style={styles.cardHorario}>
            {!diaSelecionado ? (
              <View style={styles.vazioContainer}>
                <Ionicons name="hand-left-outline" size={26} color="#b0bfcc" />
                <Text style={styles.horarioVazio}>Seleciona um dia no calendário para ver os horários.</Text>
              </View>
            ) : horarios[diaSelecionado] ? (
              <>
                <View style={styles.horarioTopo}>
                  <View style={styles.horarioIconeCirculo}>
                    <Ionicons name="time-outline" size={18} color="#2E7D32" />
                  </View>
                  <Text style={styles.horarioData}>{dataCurta(diaSelecionado)}</Text>
                  <View style={styles.chipDisponivel}>
                    <Text style={styles.chipDisponivelText}>Disponível</Text>
                  </View>
                </View>
                <Text style={styles.horarioDescricao}>{horarios[diaSelecionado]}</Text>
              </>
            ) : (
              <View style={styles.vazioContainer}>
                <Ionicons name="close-circle-outline" size={26} color="#d99" />
                <Text style={styles.horarioVazio}>Sem horário disponível neste dia.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0d1f30' },
  headerSubtitle: { fontSize: 12, color: '#7a94aa', marginTop: 4, lineHeight: 16 },
  corpoConteudo: { flex: 1, backgroundColor: '#f4f7fc' },

 proximoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FA',
    borderWidth: 1,
    borderColor: '#cfe0f0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 18,
  },
  proximoIcone: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#D6E6F5', justifyContent: 'center', alignItems: 'center',
  },
  proximoLabel: { fontSize: 10.5, fontWeight: '800', color: '#065294', letterSpacing: 0.5, marginBottom: 2 },
  proximoData: { fontSize: 15, fontWeight: '700', color: '#0d1f30' },
  proximoHoras: { fontSize: 13, color: '#5a7a9a', marginTop: 1 },

  textoInformativo: { fontSize: 13, color: '#5a7a9a', textAlign: 'center', marginBottom: 12, fontWeight: '600' },

  calendarioContainer: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#eaf0f8', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },
  legendaContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legendaDot: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#2E7D32', marginRight: 8 },
  legendaTexto: { fontSize: 13, color: '#7a94aa', fontWeight: '600' },

  seccaoTitulo: { fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  cardHorario: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eaf0f8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  horarioTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  horarioIconeCirculo: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  horarioData: { fontSize: 15, fontWeight: 'bold', color: '#0d1f30', flex: 1 },
  chipDisponivel: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipDisponivelText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  horarioDescricao: { fontSize: 15, color: '#0d1f30', lineHeight: 22 },

  vazioContainer: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  horarioVazio: { fontSize: 13, color: '#7a94aa', textAlign: 'center' },
});