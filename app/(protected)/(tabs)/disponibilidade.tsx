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
      {/* Header Fixo fora do Scroll para colar no topo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Disponibilidade do Técnico</Text>
        <Text style={styles.headerSubtitle}>
          Consulta os horários onde podes receber e devolver o material reservado
        </Text>
      </View>

      {/* Conteúdo em Scroll com o fundo correto */}
      <View style={styles.corpoConteudo}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          
          {/* Texto que passou para fora do Header */}
         <Text style={styles.textoInformativo1}>
            Os dias a verde indicam que o técnico está disponível.
          </Text>
          <Text style={[styles.textoInformativo2, { fontWeight: '600' }]}>
            Toca num dia para ver os horários.
          </Text>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff' // Força o topo da barra de estado a ser branco
  },
  header: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 20 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0d1f30' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: '#7a94aa', 
    marginTop: 4,
    lineHeight: 16
  },
  corpoConteudo: {
    flex: 1,
    backgroundColor: '#f4f7fc' // Todo o resto do ecrã assume o azul/cinza claro
  },
  textoInformativo2: {
    textAlign: 'center',
    fontSize: 13,
    color: '#5a7a9a',
    marginBottom: 16,
    lineHeight: 18,
  },
  textoInformativo1: { fontSize: 13, color: '#212121', textAlign: 'center', marginBottom: 10, marginTop: 15, lineHeight: 18, },
  calendarioContainer: { 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#eaf0f8', 
    borderRadius: 14, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1
  },
  legendaContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12 
  },
  legendaDot: { 
    width: 14, 
    height: 14, 
    borderRadius: 4, 
    backgroundColor: '#E8F5E9', 
    borderWidth: 1, 
    borderColor: '#2E7D32', 
    marginRight: 8 
  },
  legendaTexto: { 
    fontSize: 13, 
    color: '#7a94aa' ,
    fontWeight: '600'
  },
  seccaoTitulo: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#9E9E9E', 
    marginTop: 24, 
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },


  cardHorario: { 
    backgroundColor: '#FFF', 
    borderRadius: 14, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#eaf0f8',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 8, 
    elevation: 2 
  },
  horarioHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  horarioData: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#2E7D32', 
    marginLeft: 8 
  },
  horarioDescricao: { 
    fontSize: 15, 
    color: '#0d1f30', 
    lineHeight: 22 
  },
  horarioVazio: { 
    fontSize: 13, 
    color: '#7a94aa', 
    textAlign: 'center', 
    paddingVertical: 10 
  },
});