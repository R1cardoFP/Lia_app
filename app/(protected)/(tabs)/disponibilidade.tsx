import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#005596" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.titulo}>Disponibilidade do Técnico</Text>
        <Text style={styles.subtitulo}>Os dias a verde indicam que o técnico está disponível. Toca num dia para ver os horários.</Text>

        <View style={styles.calendarioContainer}>
          <Calendar
            markingType="custom"
            markedDates={datasMarcadas}
            onDayPress={(day) => setDiaSelecionado(day.dateString)}
            theme={{
              todayTextColor: '#005596',
              arrowColor: '#005596',
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
            <Text style={styles.horarioVazio}>Seleciona um dia no calendário para ver os horários.</Text>
          ) : horarios[diaSelecionado] ? (
            <>
              <View style={styles.horarioHeader}>
                <Ionicons name="time-outline" size={20} color="#2E7D32" />
                <Text style={styles.horarioData}>{diaSelecionado.split('-').reverse().join('/')}</Text>
              </View>
              <Text style={styles.horarioDescricao}>{horarios[diaSelecionado]}</Text>
            </>
          ) : (
            <Text style={styles.horarioVazio}>Sem horário disponível neste dia.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#1A237E', marginBottom: 6 },
  subtitulo: { fontSize: 14, color: '#757575', marginBottom: 20, lineHeight: 20 },
  calendarioContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12, overflow: 'hidden' },
  legendaContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legendaDot: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#2E7D32', marginRight: 8 },
  legendaTexto: { fontSize: 13, color: '#757575' },
  seccaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginTop: 24, marginBottom: 12 },
  cardHorario: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  horarioHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  horarioData: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32', marginLeft: 8 },
  horarioDescricao: { fontSize: 16, color: '#212121', lineHeight: 24 },
  horarioVazio: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', paddingVertical: 10 },
});