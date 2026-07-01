import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { default as React, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReserva } from '../../../contexts/reservaContext';
import api, { API_URL } from '../../../services/api';

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
  
  const { reserva, iniciarReserva, removerItem, limparReserva, temReservaAtiva } = useReserva() as any;

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

  const [submitting, setSubmitting] = useState(false);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const obterUrlImagem = (caminho?: string | null): string | undefined => {
    if (!caminho) return undefined;
    return `${API_URL}/${caminho.startsWith('/') ? caminho.substring(1) : caminho}`;
  };

  useEffect(() => {
    carregarCentrosDeCusto();
  }, []);

  const carregarCentrosDeCusto = async () => {
    try {
      const response = await api.get('/centros-custo');
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

  const handleCancelarReserva = () => {
    Alert.alert(
      "Cancelar Reserva",
      "Tens a certeza que queres cancelar? Todos os dados e itens escolhidos serão limpos.",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive", 
          onPress: () => {
            setDataInicio('');
            setDataFim('');
            setMotivo('');
            setCentroCusto(null);
            setIsCiclica(false);
            setDiaCiclico(null);
            limparReserva();
          } 
        }
      ]
    );
  };

  const handleConfirmarReservaFinal = async () => {
    if (reserva.itens.length === 0) {
      Alert.alert('Carrinho Vazio', 'Tens de adicionar pelo menos um equipamento do catálogo.');
      return;
    }

    Alert.alert(
      "Confirmar Submissão",
      "Tens a certeza que queres submeter esta reserva?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Submeter",
          onPress: async () => {
            setSubmitting(true);
            try {  
              const itensPuros = reserva.itens
                .filter((i: any) => !i.is_kit)
                .map((i: any) => ({ id: i.id, quantity: i.quantidadeSelecionada }));
                
              const kitsPuros = reserva.itens
                .filter((i: any) => i.is_kit)
                .map((i: any) => ({ id: i.id, quantity: i.quantidadeSelecionada }));

              let ciclicaFormatada = 1;
              if (reserva.isCiclica && reserva.diaCiclico !== null) {
                ciclicaFormatada = reserva.diaCiclico + 2;
              }

              const dadosParaEnviar = {
                description: reserva.motivo,
                start_date: reserva.dataInicio,
                end_date: reserva.dataFim,
                cost_center_id: reserva.centroCusto,
                ciclica_id: ciclicaFormatada,
                items: itensPuros,
                kits: kitsPuros
              };

              const response = await api.post('/reservas/criar', dadosParaEnviar);

              if (response.data.status === 'success') {
                Alert.alert('Sucesso', 'A tua requisição foi submetida com sucesso!', [
                  { text: 'OK', onPress: () => { limparReserva(); router.push('/reservas'); } }
                ]);
              }
            } catch (error: any) {
              const mensagemErro = error.response?.data?.message || 'Ocorreu um problema ao submeter a reserva no servidor.';
              Alert.alert('Erro ao Reservar', mensagemErro);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };


  const formatarData = (s: string) => (s ? s.split('-').reverse().join('/') : '--');

   const calcularNumeroDias = () => {
    if (!reserva.dataInicio || !reserva.dataFim) return 1;
    const start = new Date(reserva.dataInicio + 'T00:00:00');
    const end = new Date(reserva.dataFim + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;

    // Não cíclica: diferença de dias (igual ao backend), mínimo 1
    if (!reserva.isCiclica || reserva.diaCiclico === null || reserva.diaCiclico === undefined) {
      const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
      return diff <= 0 ? 1 : diff;
    }
    // Cíclica: conta as ocorrências do dia da semana no intervalo
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      if (d.getDay() === reserva.diaCiclico) count++;
      d.setDate(d.getDate() + 1);
    }
    return count === 0 ? 1 : count;
  };

  const somaPorDia = reserva.itens.reduce(
    (acc: number, i: any) => acc + Number(i.preco || i.price_day || 20) * i.quantidadeSelecionada,
    0
  );
  const numeroDias = calcularNumeroDias();
  const totalEstimado = somaPorDia * numeroDias;
  const labelCiclico = DIAS_DA_SEMANA.find(d => d.id === reserva.diaCiclico)?.label;


  // ========================================================
  // RENDERIZAÇÃO 1: FORMULÁRIO COM DATE PICKERS E SELECTS
  // ========================================================
  if (!temReservaAtiva) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

        {/* HEADER CUSTOMIZADO */}
        <View style={styles.headerCustom}>
          <Text style={styles.tituloPrincipal}>Nova Reserva</Text>
          <Text style={styles.subtituloPrincipal}>Define o período e as informações da tua requisição</Text>
        </View>

        {/* CORPO COM FUNDO AZUL ATÉ ÀS TABS */}
        <View style={styles.corpoFormulario}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[
              styles.scrollContainer, 
              { paddingBottom: tabBarHeight + insets.bottom + 10 }
            ]}
          >
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
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.headerCarrinho}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.tituloPrincipal}>A tua Reserva</Text>
          <Text style={styles.subtituloPrincipal}>
            {reserva.itens.length} {reserva.itens.length === 1 ? 'equipamento' : 'equipamentos'}
          </Text>
        </View>
        <TouchableOpacity style={styles.btnLimparTudo} onPress={handleCancelarReserva}>
          <Text style={styles.btnLimparTudoText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.corpoFormulario}>

     {/* Aviso: sem custo para o aluno */}
        <View style={styles.avisoIpvcContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#00a385" style={{ marginRight: 10 }} />
          <Text style={styles.avisoIpvcTexto}>
            Sem custo para o aluno — o valor é imputado ao centro de custo selecionado.
          </Text>
        </View>


        <FlatList
          style={{ flex: 1 }}
          data={reserva.itens}
          keyExtractor={(item, index) => String(item.id) + (item.is_kit ? '-kit' : '-item') + index}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: tabBarHeight + 140 }}
          showsVerticalScrollIndicator={false}

          ListHeaderComponent={() => (
            <View style={styles.cardInfoPrincipal}>
              {/* Período */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcone}><Ionicons name="calendar-outline" size={18} color="#065294" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>PERÍODO</Text>
                  <Text style={styles.infoValor}>{formatarData(reserva.dataInicio)} a {formatarData(reserva.dataFim)}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              {/* Motivo */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcone}><Ionicons name="document-text-outline" size={18} color="#065294" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>MOTIVO</Text>
                  <Text style={styles.infoValor}>{reserva.motivo || '—'}</Text>
                </View>
              </View>

              {/* Repetição (só se cíclica) */}
              {reserva.isCiclica && reserva.diaCiclico !== null && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcone}><Ionicons name="repeat" size={18} color="#065294" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>REPETIÇÃO</Text>
                      <Text style={styles.infoValor}>Todas as {labelCiclico}s</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          ListEmptyComponent={() => (
            <View style={styles.carrinhoVazioContainer}>
              <Ionicons name="cart-outline" size={50} color="#9E9E9E" />
              <Text style={styles.carrinhoVazioTexto}>Ainda não adicionaste nenhum equipamento.</Text>
              <TouchableOpacity style={styles.btnIrAoCatalogo} onPress={() => router.push('/catalogo')}>
                <Text style={styles.btnIrAoCatalogoText}>Ir para o Catálogo</Text>
              </TouchableOpacity>
            </View>
          )}

          renderItem={({ item, index }) => {
            const isFirstItem = !item.is_kit && index === 0;
            const isFirstKit = item.is_kit && (index === 0 || !reserva.itens[index - 1]?.is_kit);
            return (
              <View style={{ marginBottom: 2 }}>
                {isFirstItem && <Text style={styles.sectionTitle}>ITENS ADICIONADOS</Text>}
                {isFirstKit && <Text style={[styles.sectionTitle, { marginTop: 22 }]}>KITS ADICIONADOS</Text>}

                <TouchableHighlight
                  key={`${item.is_kit ? 'kit' : 'item'}-${item.id}-${index}`}
                  style={styles.cardLista}
                  underlayColor="#E8EAF6"
                  onPress={() => router.push(`/detalhes/${item.id}?tipo=${item.is_kit ? 'kit' : 'item'}`)}
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
                      <Text style={styles.cardSubtitulo} numberOfLines={1}>{item.model || item.description || 'Sem descrição.'}</Text>
                      <Text style={styles.textoPreco}>{Number(item.preco || item.price_day || 20).toFixed(2)}€ / dia</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.badgeQtd}><Text style={styles.badgeQtdText}>{item.quantidadeSelecionada}x</Text></View>
                      <TouchableOpacity style={styles.btnRemoverItem} onPress={() => removerItem(item.id, item.is_kit)}>
                        <Ionicons name="trash-outline" size={20} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableHighlight>
              </View>
            );
          }}
        />
      </View>

      {/* BARRA FIXA COM TOTAL + SUBMETER */}
      {reserva.itens.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: tabBarHeight + 12 }]}>
          <View>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValor}>{totalEstimado.toFixed(2)}€</Text>
            <Text style={styles.totalSub}>{numeroDias} {numeroDias === 1 ? 'dia' : 'dias'} · {somaPorDia.toFixed(2)}€/dia</Text>
          </View>
          <TouchableOpacity
            style={[styles.btnConfirmar, submitting && { opacity: 0.7 }]}
            onPress={handleConfirmarReservaFinal}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnConfirmarText}>Submeter</Text>
              </>
            )}
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
    backgroundColor: '#f4f7fc',
  },
  scrollContainer: { 
    paddingBottom: 10,
    paddingTop: 35,
  },
  containerFormulario: { 
    flexDirection: 'column', 
    gap: 14,
    paddingHorizontal: 20
  },
  cardLista: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    marginBottom: 10, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
    overflow: 'hidden'
  },
  cardContentInternal: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    flex: 1 
  },
  imagemListaMock: { 
    width: 65, 
    height: 65, 
    backgroundColor: '#E8EAF6', 
    borderRadius: 12, 
    marginRight: 15 
  },
  listaTextoInfo: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  cardTitulo: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#212121', 
    marginBottom: 2 
  },
  cardSubtitulo: { 
    fontSize: 12, 
    color: '#757575', 
    marginBottom: 4 
  },
  textoPreco: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#065294' 
  },
  badgeQtd: { 
    backgroundColor: '#f4f7fc', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#eaf0f8' 
  },
  badgeQtdText: { 
    color: '#065294', 
    fontWeight: 'bold', 
    fontSize: 14 
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
    marginTop: 2,
  },
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
  labelSecundario: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#8a9fb4', 
    letterSpacing: 0.5 
  },
  tituloDataTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#212121' 
  },
  motivoContainer: { 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0' 
  },
  motivoTexto: { 
    fontSize: 14, 
    color: '#212121', 
    marginTop: 6, 
    lineHeight: 20 
  },
  textoMotivo: { 
    fontSize: 13, 
    color: '#5a7a9a', 
    fontWeight: '500', 
    marginTop: 4 
  },
  dropdownText: { 
    fontSize: 15, 
    color: '#212121' 
  },
  dropdownPlaceholder: { 
    fontSize: 15, 
    color: '#9E9E9E' 
  },
  rowSwitch: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 25 
  },
  labelSwitch: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#212121' 
  },
  sublabelSwitch: { 
    fontSize: 12, 
    color: '#757575', 
    marginTop: 2, 
    paddingRight: 10 
  },
  btnIniciar: { 
    backgroundColor: '#065294',   
    borderRadius: 8,              
    paddingVertical: 15,          
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
  }, 
  btnIniciarText: { 
    color: '#FFF', 
    fontSize: 15,                 
    fontWeight: '700',            
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 20, 
    width: '100%', 
    maxWidth: 360, 
    elevation: 5, 
    maxHeight: '80%' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#212121', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  modalOpcao: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0', 
    alignItems: 'center' 
  },
  modalOpcaoText: { 
    fontSize: 16, 
    color: '#546E7A', 
    flex: 1 
  },
  modalOpcaoAtiva: { 
    color: '#065294', 
    fontWeight: 'bold' 
  },
  modalCancelar: { 
    marginTop: 15, 
    paddingVertical: 10, 
    alignItems: 'center' 
  },
  modalCancelarText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#E53935' 
  },
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
  carrinhoVazioContainer: { 
    alignItems: 'center', 
    marginTop: 60, 
    padding: 20 
  },
  carrinhoVazioTexto: { 
    fontSize: 15, 
    color: '#9E9E9E', 
    textAlign: 'center', 
    marginTop: 15, 
    marginBottom: 20 
  },
  btnIrAoCatalogo: { 
    backgroundColor: '#065294', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  btnIrAoCatalogoText: { 
    color: '#FFF', 
    fontWeight: 'bold' 
  },
  btnRemoverItem: { 
    padding: 4 
  },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', marginTop: 20, marginBottom: 12, letterSpacing: 0.5 },

  headerCarrinho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 13, backgroundColor: '#FFF' },

  cardInfoPrincipal: { backgroundColor: '#fff', borderRadius: 16, marginTop: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcone: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#eaf2fb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 10.5, fontWeight: '800', color: '#8a9fb4', letterSpacing: 0.5, marginBottom: 2 },
  infoValor: { fontSize: 14, color: '#0d1f30', fontWeight: '600' },
  infoDivider: { height: 1, backgroundColor: '#eef2f7', marginVertical: 12 },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#eef2f7',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 12,
  },
  totalLabel: { fontSize: 11, color: '#7a94aa', fontWeight: '600' },
  totalValor: { fontSize: 22, fontWeight: '800', color: '#065294', marginTop: 1 },
  totalSub: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  btnConfirmar: { backgroundColor: '#065294', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, height: 50, borderRadius: 12 },
  btnConfirmarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  avisoIpvcContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,163,133,0.12)', marginHorizontal: 20, marginTop: 15, padding: 12, borderRadius: 12, alignItems: 'center' },
  avisoIpvcTexto: { color: '#00a385', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
});