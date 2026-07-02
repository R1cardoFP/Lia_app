import ErroConexao from '@/components/ErroConexao';
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { default as React, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReserva } from '../../../contexts/reservaContext';
import api, { API_URL } from '../../../services/api';

interface Categoria {
  id: string | number;
  description: string;
}

interface Kit {
  id: number;
  name: string;
  nome?: string;
  description: string;
  model?: string;
  image?: string;
  kit_unities_count: number;
  item_unities_count?: number;
  price_day?: number | string;
}

interface Equipamento {
  id: number;
  nome: string;
  model: string;
  image?: string;
  item_unities_count: number;
  price_day?: number | string;
}

export default function Catalogo() {
  const { user, logout } = useAuth();

  const userName = user?.name || 'Utilizador';
  const partesNome = user?.name?.trim().split(' ') || [];
  const userInitials = partesNome.length > 1
    ? (partesNome[0][0] + partesNome[partesNome.length - 1][0]).toUpperCase()
    : userName.substring(0, 2).toUpperCase();

  const obterUrlImagem = (caminho?: string | null): string | undefined => {
    if (!caminho) return undefined;
    return `${API_URL}/${caminho.startsWith('/') ? caminho.substring(1) : caminho}`;
  };

  const imageUri = user?.image
    ? `${API_URL}/${user.image.startsWith('/') ? user.image.substring(1) : user.image}`
    : undefined;

  const [categoriasDB, setCategoriasDB] = useState<Categoria[]>([{ id: 'Todos', description: 'Todos' }]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | number>('Todos');
  const [destaquesKits, setDestaquesKits] = useState<Kit[]>([]);
  const [equipamentosItens, setEquipamentosItens] = useState<Equipamento[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [temMaisPaginas, setTemMaisPaginas] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [erroConexao, setErroConexao] = useState(false);

  const { temReservaAtiva, reserva } = useReserva() as any;

  useFocusEffect(
    useCallback(() => {
      carregarCatalogo(1, categoriaAtiva, pesquisa);
    }, [temReservaAtiva, categoriaAtiva])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarCatalogo(1, categoriaAtiva, pesquisa);
    }, 300);
    return () => clearTimeout(timer);
  }, [pesquisa]);

  const carregarCatalogo = async (numeroPagina: number, catId: string | number = categoriaAtiva, termoPesquisa: string = pesquisa) => {
    if (loadingMore) return;
    if (numeroPagina > 1 && !temMaisPaginas) return;
    try {
      if (numeroPagina === 1) setLoadingInitial(true);
      else setLoadingMore(true);

      setErroConexao(false);
      
      let endpoint = `/catalogo?page=${numeroPagina}&categoria_id=${catId}&search=${encodeURIComponent(termoPesquisa)}`;
      if (temReservaAtiva) endpoint += `&start_date=${reserva.dataInicio}&end_date=${reserva.dataFim}`;

      const response = await api.get(endpoint);
      if (response.data.status === 'success') {
        const novosDados = response.data.data;
        let itensQueChegaram = novosDados.itens;
        let kitsQueChegaram = novosDados.kits || [];

        if (temReservaAtiva) {
          itensQueChegaram = itensQueChegaram.filter((item: any) => item.item_unities_count > 0);
          kitsQueChegaram = kitsQueChegaram.filter((kit: any) => (kit.kit_unities_count || kit.item_unities_count) > 0);
        }

        if (numeroPagina === 1 && novosDados.categorias) {
          setCategoriasDB([{ id: 'Todos', description: 'Todos' }, { id: 'Kits', description: 'Kits' }, ...novosDados.categorias]);
        }
        if (numeroPagina === 1) {
          setDestaquesKits(kitsQueChegaram);
          setEquipamentosItens(itensQueChegaram);
        } else {
          setEquipamentosItens(listaAntiga => [...listaAntiga, ...itensQueChegaram]);
        }
        setPaginaAtual(novosDados.paginacao.pagina_atual);
        setTemMaisPaginas(novosDados.paginacao.tem_mais);
      }
    } catch (error: any) {
      console.log('Erro ao carregar catálogo:', error);
      setErroConexao(true);
      if (error.response?.status === 401) {
        logout(); 
      }
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  const mudarCategoria = (idCategoria: string | number) => {
    setCategoriaAtiva(idCategoria);
    setTemMaisPaginas(true);
    carregarCatalogo(1, idCategoria, pesquisa);
  };

  const aoChegarAoFimDaLista = () => {
    if (!loadingMore && temMaisPaginas) carregarCatalogo(paginaAtual + 1, categoriaAtiva, pesquisa);
  };

  const BadgeDisponibilidade = ({ quantidade }: { quantidade: number }) => {
    if (quantidade === 0) {
      return <View style={[styles.badge, { backgroundColor: '#F0F0F0' }]}><Text style={[styles.badgeText, { color: '#9E9E9E' }]}>Esgotado</Text></View>;
    }
    return <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}><Text style={[styles.badgeText, { color: '#2E7D32' }]}>{quantidade} disp.</Text></View>;
  };


  if (erroConexao && !loadingInitial) {
  return (
    <ErroConexao 
      mensagem="Não foi possível carregar o catálogo. Verifica o Wi-Fi ou dados móveis."
      onTentarNovamente={() => carregarCatalogo(1, categoriaAtiva, pesquisa)} 
    />
  );
}


  if (loadingInitial && categoriasDB.length <= 1 && equipamentosItens.length === 0) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
      <ActivityIndicator size="large" color="#065294" />
    </View>
  );
}

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color="#065294" /></View>;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#065294" />
      <FlatList
        data={equipamentosItens}
        keyExtractor={(item, index) => String(item.id) + index}
        style={{ backgroundColor: '#f4f7fc' }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* HERO AZUL */}
            <View style={styles.hero}>
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.saudacao}>Olá,</Text>
                  <Text style={styles.nomeUtilizador} numberOfLines={1}>{userName}</Text>
                </View>
                <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/perfil')}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.imageAvatar} />
                  ) : (
                    <Text style={styles.avatarText}>{userInitials}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* PESQUISA sobre o azul */}
              <View style={styles.pesquisaContainer}>
                <Ionicons name="search-outline" size={20} color="#9E9E9E" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.pesquisaInput}
                  placeholder="Pesquisar equipamento ou modelo..."
                  placeholderTextColor="#9E9E9E"
                  value={pesquisa}
                  onChangeText={setPesquisa}
                  returnKeyType="search"
                />
                {pesquisa.length > 0 && (
                  <TouchableOpacity onPress={() => setPesquisa('')}>
                    <Ionicons name="close-circle" size={18} color="#B0BEC5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* CHIPS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer} contentContainerStyle={{ paddingRight: 20 }}>
              {categoriasDB.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, categoriaAtiva === cat.id && styles.chipActive]}
                  onPress={() => mudarCategoria(cat.id)}
                >
                  <Text style={[styles.chipText, categoriaAtiva === cat.id && styles.chipTextActive]}>{cat.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* BANNER DE RESERVA ATIVA */}
            {temReservaAtiva && (
              <TouchableOpacity style={styles.legendaReservaContainer} onPress={() => router.push('/fazer-reserva')} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={20} color="#00a385" style={{ marginRight: 10 }} />
                <Text style={styles.legendaReservaTexto}>
                  Disponíveis para o período de {reserva?.dataInicio} a {reserva?.dataFim}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#00a385" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}

            {loadingInitial && <ActivityIndicator size="small" color="#065294" style={{ marginVertical: 15 }} />}

            {/* DESTAQUES */}
            {destaquesKits.length > 0 && pesquisa.length === 0 && (
              <>
                <Text style={styles.sectionTitle}>EM DESTAQUE (KITS)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destaquesContainer}>
                  {destaquesKits.map((kit) => (
                    <TouchableHighlight key={kit.id} underlayColor="#F5F5F5" style={{ borderRadius: 16, marginRight: 15 }} onPress={() => router.push(`/detalhes/${kit.id}?tipo=kit`)}>
                      <View style={[styles.cardDestaque, { marginRight: 0 }]}>
                        {kit.image ? (
                          <Image source={{ uri: obterUrlImagem(kit.image) }} style={styles.imagemDestaqueMock} />
                        ) : (
                          <View style={[styles.imagemDestaqueMock, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="camera-outline" size={30} color="#B0BEC5" />
                          </View>
                        )}
                        <Text style={styles.cardTitulo} numberOfLines={1}>{kit.nome || kit.name}</Text>
                        <Text style={styles.textoPreco}>
                          {kit.price_day && kit.price_day !== 'Não definido' && Number(kit.price_day) > 0
                            ? `${Number(kit.price_day).toFixed(2)}€ / dia`
                            : 'Não definido'}
                        </Text>
                        <View style={{ marginBottom: 3 }}>
                          <BadgeDisponibilidade quantidade={kit.kit_unities_count || kit.item_unities_count || 0} />
                        </View>
                      </View>
                    </TouchableHighlight>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.sectionTitle}>
              {categoriaAtiva === 'Todos' ? 'TODOS OS EQUIPAMENTOS' :
               categoriaAtiva === 'Kits' ? 'TODOS OS KITS' :
               String(categoriasDB.find(cat => cat.id === categoriaAtiva)?.description || 'EQUIPAMENTOS FILTRADOS').toUpperCase()}
            </Text>
          </View>
        }
        
        renderItem={({ item }: { item: any }) => {
        // Descobre se o item atual é um kit
        const isKit = categoriaAtiva === 'Kits' || item.is_kit === true;

        return (
          <TouchableHighlight 
            underlayColor="#F5F5F5" 
            style={{ borderRadius: 16, marginHorizontal: 20, marginBottom: 12 }} 
            onPress={() => router.push(`/detalhes/${item.id}?tipo=${isKit ? 'kit' : 'item'}`)}
          >
            <View style={styles.cardLista}>
              {item.image ? (
                <Image source={{ uri: obterUrlImagem(item.image) }} style={styles.imagemListaMock} />
              ) : (
                <View style={[styles.imagemListaMock, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                  <Ionicons name="camera-outline" size={24} color="#B0BEC5" />
                </View>
              )}
              
              <View style={styles.listaTextoInfo}>
                {/* Nome do Item ou Kit */}
                <Text style={styles.cardTitulo} numberOfLines={1}>{item.nome || item.name}</Text>
                
                {/* SÓ exibe o modelo se NÃO for um kit */}
                {!isKit && (
                  <Text style={styles.cardSubtitulo} numberOfLines={1}>{item.model}</Text>
                )}
                
                {/* Lógica do preço: se for nulo, zero ou 'Não definido', mostra 'Não definido' */}
                <Text style={styles.textoPreco}>
                  {item.price_day && item.price_day !== 'Não definido' && Number(item.price_day) > 0
                    ? `${Number(item.price_day).toFixed(2)}€ / dia`
                    : 'Não definido'}
                </Text>
              </View>
              
              <BadgeDisponibilidade quantidade={item.item_unities_count || item.kit_unities_count || 0} />
            </View>
          </TouchableHighlight>
        );
      }}
        onEndReached={aoChegarAoFimDaLista}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loadingInitial ? (
            <Text style={{ textAlign: 'center', color: '#9E9E9E', marginTop: 20, paddingHorizontal: 20 }}>
              Nenhum equipamento encontrado com os filtros atuais.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#065294' },
  container: { paddingBottom: 100, backgroundColor: '#f4f7fc' },

  // HERO
  hero: {
    backgroundColor: '#065294',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  saudacao: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  nomeUtilizador: { fontSize: 22, fontWeight: '800', color: '#fff', maxWidth: 240 },
  avatarContainer: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imageAvatar: { width: 46, height: 46, borderRadius: 23 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pesquisaContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 14, height: 50, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  pesquisaInput: { flex: 1, fontSize: 14, color: '#212121', height: '100%' },

  chipsContainer: { flexDirection: 'row', paddingLeft: 20, marginTop: 18 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#065294', borderColor: '#065294' },
  chipText: { fontSize: 12.5, color: '#5a7a9a', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  textoPreco: { fontSize: 12, fontWeight: '700', color: '#065294' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#8a9fb4', marginHorizontal: 20, marginTop: 22, marginBottom: 14, letterSpacing: 0.5 },

  destaquesContainer: { paddingLeft: 20 },
  cardDestaque: { width: 160, backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 10 },
  imagemDestaqueMock: { width: '100%', height: 100, backgroundColor: '#E8EAF6', borderRadius: 10, marginBottom: 12 },
  cardTitulo: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  cardSubtitulo: { fontSize: 12, color: '#757575', marginBottom: 4 },
  cardLista: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imagemListaMock: { width: 60, height: 60, backgroundColor: '#E8EAF6', borderRadius: 10, marginRight: 15 },
  listaTextoInfo: { flex: 1, justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

 legendaReservaContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 163, 133, 0.12)', 
    marginHorizontal: 20,
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between', // Garante que a seta fique na ponta direita
    //borderWidth: 1,
    //borderColor: 'rgba(0, 163, 133, 0.25)',
  },
  legendaIcone: {
    marginRight: 10,
  },
  legendaReservaTexto: {
    color: '#00a385', 
    fontSize: 13,
    fontWeight: '600', 
    flex: 1, // Faz o texto ocupar o espaço disponível antes da seta
    lineHeight: 18,
  },
  containerErro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  tituloErro: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 15,
  },
  subtituloErro: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  btnTentarNovamente: {
    marginTop: 25,
    backgroundColor: '#065294',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  btnTentarNovamenteTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },

});