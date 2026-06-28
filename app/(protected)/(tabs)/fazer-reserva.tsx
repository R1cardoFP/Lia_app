import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { default as React, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReserva } from '../../../contexts/reservaContext';
import api from '../../../services/api';

// Configuração do Calendário para Português
LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt';

const DIAS_DA_SEMANA = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export default function FazerReserva() {
  const router = useRouter();
  const { reserva, iniciarReserva, removerItem, limparReserva, temReservaAtiva } = useReserva();

  // Estados dos Dados do Formulário
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [motivo, setMotivo] = useState('');
  const [centroCusto, setCentroCusto] = useState<any>(null);
  const [isCiclica, setIsCiclica] = useState(false);
  const [diaCiclico, setDiaCiclico] = useState<any>(null);

  // Estado para armazenar os Centros de Custo vindos da BD
  const [centrosCustoDB, setCentrosCustoDB] = useState([]);

  // Estados de visibilidade dos Modais
  const [modalDataInicio, setModalDataInicio] = useState(false);
  const [modalDataFim, setModalDataFim] = useState(false);
  const [modalCentroCusto, setModalCentroCusto] = useState(false);
  const [modalDiaCiclico, setModalDiaCiclico] = useState(false);

  useEffect(() => {
    carregarCentrosDeCusto();
  }, []);

  const carregarCentrosDeCusto = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.get('/centros-custo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setCentrosCustoDB(response.data.data);
      }
    } catch (error) {
        console.log('Erro ao buscar centros de custo à API.');
      setCentrosCustoDB([]);
    }
  };

  const handleIniciarReserva = () => {
    if (!dataInicio || !dataFim || !motivo || !centroCusto) {
      Alert.alert('Atenção', 'Por favor, preenche as datas, o motivo e o centro de custo.');
      return;
    }
    if (isCiclica && !diaCiclico) {
      Alert.alert('Atenção', 'Como ativaste a reserva cíclica, tens de escolher o dia da semana.');
      return;
    }

    iniciarReserva({
      dataInicio,
      dataFim,
      motivo,
      centroCusto: centroCusto.id,
      isCiclica,
      diaCiclico: diaCiclico ? diaCiclico.id : null
    });

    router.push('/catalogo');
  };

  const handleConfirmarReservaFinal = async () => {
    if (reserva.itens.length === 0) {
      Alert.alert('Carrinho Vazio', 'Tens de adicionar pelo menos um equipamento do catálogo.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // 1. Separar os itens e os kits em dois arrays distintos como o teu Laravel pede
      const itensPuros = reserva.itens
        .filter((i: any) => !i.is_kit)
        .map((i: any) => ({ id: i.id, quantity: i.quantidadeSelecionada }));
        
      const kitsPuros = reserva.itens
        .filter((i: any) => i.is_kit)
        .map((i: any) => ({ id: i.id, quantity: i.quantidadeSelecionada }));

      // 2. Calcular o ciclica_id com base na matemática fantástica do teu backend
      // Se não for cíclica, ID é 1. Se for, é o ID do dia da semana (0 a 6) + 2.
      let ciclicaFormatada = 1;
      if (reserva.isCiclica && reserva.diaCiclico !== null) {
        ciclicaFormatada = reserva.diaCiclico + 2;
      }

      // 3. Montar o pacote final com os nomes exatos do teu Request de validação
      const dadosParaEnviar = {
        description: reserva.motivo,
        start_date: reserva.dataInicio,
        end_date: reserva.dataFim,
        cost_center_id: reserva.centroCusto,
        ciclica_id: ciclicaFormatada,
        items: itensPuros,
        kits: kitsPuros
      };

      // ATENÇÃO: Confirma se o URL aqui bate certo com o teu api.php
      const response = await api.post('/reservas/criar', dadosParaEnviar, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        Alert.alert('Sucesso', 'A tua requisição foi submetida com sucesso!', [
          { text: 'OK', onPress: () => { limparReserva(); router.push('/reservas'); } }
        ]);
      }
    } catch (error: any) {
      // Se o Laravel devolver um erro de validação (ex: falta de stock ou user_type_id == 6)
      const mensagemErro = error.response?.data?.message || 'Ocorreu um problema ao submeter a reserva no servidor.';
      Alert.alert('Erro ao Reservar', mensagemErro);
    }
  };

  // ========================================================
  // RENDERIZAÇÃO 1: FORMULÁRIO COM DATE PICKERS E SELECTS
  // ========================================================
// ========================================================
  // RENDERIZAÇÃO 1: FORMULÁRIO COM DATE PICKERS E SELECTS
  // ========================================================
  if (!temReservaAtiva) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

        {/* HEADER CUSTOMIZADO (Igual ao ecrã de histórico) */}
        <View style={styles.headerCustom}>
          <Text style={styles.tituloPrincipal}>Nova Reserva</Text>
          <Text style={styles.subtituloPrincipal}>Define o período e as informações da tua requisição</Text>
        </View>

        {/* CORPO COM FUNDO AZUL ATÉ ÀS TABS */}
        <View style={styles.corpoFormulario}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            <View style={styles.containerFormulario}>
              
              {/* CAMPOS DE DATA LADO A LADO */}
              <View style={styles.gridRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Data de Início</Text>
                  <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalDataInicio(true)}>
                    <Ionicons name="calendar-outline" size={15} color="#b0bfcc" style={styles.inputIcon} />
                    <View style={styles.inpFake}>
                      <Text style={dataInicio ? styles.dropdownText : styles.dropdownPlaceholder}>
                        {dataInicio || 'Selecionar...'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Data de Fim</Text>
                  <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalDataFim(true)}>
                    <Ionicons name="calendar-outline" size={15} color="#b0bfcc" style={styles.inputIcon} />
                    <View style={styles.inpFake}>
                      <Text style={dataFim ? styles.dropdownText : styles.dropdownPlaceholder}>
                        {dataFim || 'Selecionar...'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* MOTIVO */}
              <Text style={styles.label}>Motivo / Justificação</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="document-text-outline" size={15} color="#b0bfcc" style={[styles.inputIcon, { top: 14 }]} />
                <TextInput 
                  style={[styles.inp, { height: 90, textAlignVertical: 'top', paddingTop: 12, paddingLeft: 38 }]} 
                  multiline 
                  placeholder="Ex: Projeto final de multimédia..." 
                  placeholderTextColor="#b0bfcc" 
                  value={motivo} 
                  onChangeText={setMotivo} 
                />
              </View>

              {/* CENTRO DE CUSTO */}
              <Text style={styles.label}>Centro de Custo</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalCentroCusto(true)}>
                <Ionicons name="business-outline" size={15} color="#b0bfcc" style={styles.inputIcon} />
                <View style={styles.inpFake}>
                  <Text style={centroCusto ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {centroCusto ? centroCusto.name : 'Selecionar centro de custo...'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={14} color="#b0bfcc" style={styles.inputIconRight} />
              </TouchableOpacity>

              {/* SWITCH CÍCLICA */}
              <View style={styles.rowSwitch}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelSwitch}>Reserva Cíclica</Text>
                  <Text style={styles.sublabelSwitch}>Pretendes repetir este dia semanalmente?</Text>
                </View>
                <Switch 
                  value={isCiclica} 
                  onValueChange={setIsCiclica} 
                  trackColor={{ false: '#9E9E9E', true: '#00a385' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#9E9E9E"
                />
              </View>

              {/* DIA DA SEMANA */}
              {isCiclica && (
                <>
                  <Text style={styles.label}>Em qual dia da semana?</Text>
                  <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalDiaCiclico(true)}>
                    <Ionicons name="time-outline" size={15} color="#b0bfcc" style={styles.inputIcon} />
                    <View style={styles.inpFake}>
                      <Text style={diaCiclico ? styles.dropdownText : styles.dropdownPlaceholder}>
                        {diaCiclico ? `Todas as ${diaCiclico.label}s` : 'Selecionar dia...'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={14} color="#b0bfcc" style={styles.inputIconRight} />
                  </TouchableOpacity>
                </>
              )}

              {/* BOTÃO SUBMETER */}
              <TouchableOpacity style={styles.btnIniciar} onPress={handleIniciarReserva}>
                <Text style={styles.btnIniciarText}>Escolher Equipamentos</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ======================================================== */}
        {/* OS TEUS MODAIS ORIGINAIS (Recuperados com sucesso!)       */}
        {/* ======================================================== */}
        
        {/* MODAL DATA INÍCIO */}
        <Modal visible={modalDataInicio} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Data de Início</Text>
              <Calendar 
                theme={{ todayTextColor: '#1A237E', arrowColor: '#1A237E' }}
                onDayPress={(day) => { setDataInicio(day.dateString); setModalDataInicio(false); }}
              />
              <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalDataInicio(false)}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL DATA FIM */}
        <Modal visible={modalDataFim} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Data de Fim</Text>
              <Calendar 
                theme={{ todayTextColor: '#1A237E', arrowColor: '#1A237E' }}
                minDate={dataInicio || undefined}
                onDayPress={(day) => { setDataFim(day.dateString); setModalDataFim(false); }}
              />
              <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalDataFim(false)}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL CENTRO DE CUSTO */}
        <Modal visible={modalCentroCusto} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Centro de Custo</Text>
              <ScrollView>
                {centrosCustoDB.map((cc: any) => (
                  <TouchableOpacity key={cc.id} style={styles.modalOpcao} onPress={() => { setCentroCusto(cc); setModalCentroCusto(false); }}>
                    <Text style={[styles.modalOpcaoText, centroCusto?.id === cc.id && styles.modalOpcaoAtiva]}>{cc.name}</Text>
                    {centroCusto?.id === cc.id && <Ionicons name="checkmark" size={20} color="#1A237E" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalCentroCusto(false)}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL DIA CÍCLICO */}
        <Modal visible={modalDiaCiclico} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Dia da Semana</Text>
              {DIAS_DA_SEMANA.map((dia) => (
                <TouchableOpacity key={dia.id} style={styles.modalOpcao} onPress={() => { setDiaCiclico(dia); setModalDiaCiclico(false); }}>
                  <Text style={[styles.modalOpcaoText, diaCiclico?.id === dia.id && styles.modalOpcaoAtiva]}>{dia.label}</Text>
                  {diaCiclico?.id === dia.id && <Ionicons name="checkmark" size={20} color="#1A237E" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalDiaCiclico(false)}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    );
  }

  // ========================================================
  // RENDERIZAÇÃO 2: CARRINHO / RESUMO COM ITENS
  // ========================================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerCarrinho}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.tituloPrincipal}>A tua Reserva</Text>
          <Text style={styles.subtituloResumo} numberOfLines={1}>Período: {reserva.dataInicio} a {reserva.dataFim}</Text>
        </View>
        <TouchableOpacity style={styles.btnLimparTudo} onPress={limparReserva}>
          <Text style={styles.btnLimparTudoText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reserva.itens}
        keyExtractor={(item, index) => String(item.id) + (item.is_kit ? '-kit' : '-item') + index}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListHeaderComponent={() => (
          <View style={styles.cardInfosFixas}>
            <Text style={styles.infoFixaTexto}><Text style={{ fontWeight: 'bold' }}>Motivo:</Text> {reserva.motivo}</Text>
            {reserva.isCiclica && reserva.diaCiclico !== null && (
              <Text style={styles.infoFixaTexto}>
                <Text style={{ fontWeight: 'bold' }}>Repetição:</Text> Todas as {DIAS_DA_SEMANA.find(d => d.id === reserva.diaCiclico)?.label}s
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.carrinhoVazioContainer}>
            <Ionicons name="cart-outline" size={50} color="#B0BEC5" />
            <Text style={styles.carrinhoVazioTexto}>Ainda não adicionaste nenhum equipamento.</Text>
            <TouchableOpacity style={styles.btnIrAoCatalogo} onPress={() => router.push('/catalogo')}>
              <Text style={styles.btnIrAoCatalogoText}>Ir para o Catálogo</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardItemCarrinho}>
            <View style={styles.itemCarrinhoInfo}>
              <Text style={styles.itemCarrinhoNome} numberOfLines={1}>{item.nome}</Text>
              <Text style={styles.itemCarrinhoSub}>{item.model} • Qtd: <Text style={{ fontWeight: 'bold', color: '#065294' }}>{item.quantidadeSelecionada}</Text></Text>
            </View>
            <View style={styles.rowAcoesCarrinho}>
              <Text style={styles.itemCarrinhoPreco}>{item.preco || '20,00'}€/dia</Text>
              <TouchableOpacity style={styles.btnRemoverItem} onPress={() => removerItem(item.id, item.is_kit)}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {reserva.itens.length > 0 && (
        <View style={styles.footerFixo}>
          <TouchableOpacity style={styles.btnConfirmarFinal} onPress={handleConfirmarReservaFinal}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnConfirmarFinalText}>Confirmar e Submeter Reserva</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({


safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  headerCustom: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 13,
    
  },
  corpoFormulario: {
    flex: 1,
    backgroundColor: '#f4f7fc', // Garante que o azul clarinho vai até às tabs
  },
  scrollContainer: { 
    paddingBottom: 40,
    paddingTop: 35,
  },
  containerFormulario: { 
    flexDirection: 'column', 
    gap: 14,
    paddingHorizontal: 20 // Mantém os paddings dos inputs perfeitos nas laterais
  },

  
  tituloPrincipal: { 
    fontSize: 22,          
    fontWeight: '800',     
    color: '#0d1f30',      
    marginBottom: 4 
  },
  subtituloPrincipal: { 
    fontSize: 12,          
    color: '#7a94aa',      
    marginTop: 2 
  },
  

  // ESTILO DOS CAMPOS DO REGISTO (LIGEIRAMENTE MAIORES)
  label: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#9E9E9E',
    marginBottom: 2, 
    letterSpacing: 0.5, 
    textTransform: 'uppercase', 
  }, 
  inputWrapper: { 
    position: 'relative', 
    justifyContent: 'center', 
    marginBottom: 4,
  }, 
  inputIcon: { 
    position: 'absolute', 
    left: 12, 
    zIndex: 1, 
  }, 
  inputIconRight: {
    position: 'absolute', 
    right: 12, 
    zIndex: 1, 
  },
  inp: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingLeft: 38, 
    paddingRight: 12, 
    fontSize: 14, 
    paddingVertical: 12, 
    color: '#333', 
  }, 
  inpFake: {
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingLeft: 38, 
    paddingRight: 30, 
    fontSize: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    height: 46,
  },
  gridRow: { 
    flexDirection: 'row', 
    gap: 12, 
  }, 
  btnP: { 
    backgroundColor: '#00a385', 
    borderRadius: 8, 
    paddingVertical: 15, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 15, 
  }, 
  btnText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700', 
  },
  rowDatas: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  inputGroup: { marginBottom: 18 },

  input: { backgroundColor: '#F5F7F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 12, paddingHorizontal: 15, height: 48, fontSize: 15, color: '#212121' },
  
  dropdownInput: { flexDirection: 'row', backgroundColor: '#F5F7F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 12, paddingHorizontal: 15, height: 48, alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { fontSize: 15, color: '#212121' },
  dropdownPlaceholder: { fontSize: 15, color: '#9E9E9E' },

  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 25 },
  labelSwitch: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  sublabelSwitch: { fontSize: 12, color: '#757575', marginTop: 2, paddingRight: 10 },
  btnIniciar: { 
    backgroundColor: '#065294',   // Mantém a tua cor azul original
    borderRadius: 8,              // Arredondamento igual ao do registo
    paddingVertical: 15,          // Altura baseada em padding igual ao do registo
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 15, 
  }, 
  btnIniciarText: { 
    color: '#FFF', 
    fontSize: 15,                 // Tamanho da fonte igual ao do registo
    fontWeight: '700',            // Peso da fonte igual ao do registo
  },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, elevation: 5, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 15, textAlign: 'center' },
  modalOpcao: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  modalOpcaoText: { fontSize: 16, color: '#546E7A', flex: 1 },
  modalOpcaoAtiva: { color: '#065294', fontWeight: 'bold' },
  modalCancelar: { marginTop: 15, paddingVertical: 10, alignItems: 'center' },
  modalCancelarText: { fontSize: 16, fontWeight: 'bold', color: '#E53935' },

  headerCarrinho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  subtituloResumo: { fontSize: 14, color: '#2E7D32', fontWeight: '600', marginTop: 2 },
  btnLimparTudo: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFEBEE' },
  btnLimparTudoText: { color: '#E53935', fontWeight: 'bold', fontSize: 13 },
  cardInfosFixas: { backgroundColor: '#ECEFF1', padding: 15, borderRadius: 12, marginVertical: 15 },
  infoFixaTexto: { fontSize: 14, color: '#37474F', marginBottom: 4 },
  carrinhoVazioContainer: { alignItems: 'center', marginTop: 60, padding: 20 },
  carrinhoVazioTexto: { fontSize: 15, color: '#78909C', textAlign: 'center', marginTop: 15, marginBottom: 20 },
  btnIrAoCatalogo: { backgroundColor: '#065294', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnIrAoCatalogoText: { color: '#FFF', fontWeight: 'bold' },
  cardItemCarrinho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  itemCarrinhoInfo: { flex: 1, marginRight: 10 },
  itemCarrinhoNome: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  itemCarrinhoSub: { fontSize: 13, color: '#757575', marginTop: 2 },
  rowAcoesCarrinho: { alignItems: 'flex-end' },
  itemCarrinhoPreco: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 6 },
  btnRemoverItem: { padding: 4 },
  footerFixo: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  btnConfirmarFinal: { backgroundColor: '#2E7D32', height: 54, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnConfirmarFinalText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});