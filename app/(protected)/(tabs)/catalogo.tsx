import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { default as React, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native';
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
}

interface Equipamento {
  id: number;
  nome: string;
  model: string;
  image?: string;
  item_unities_count: number;
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

  const { temReservaAtiva, reserva } = useReserva() as any;

  // Carrega o catálogo ao focar no ecrã (respeitando a pesquisa atual se houver)
  useFocusEffect(
    useCallback(() => {
      carregarCatalogo(1, categoriaAtiva, pesquisa);
    }, [temReservaAtiva, categoriaAtiva])
  );

  // DEBOUNCE: Escuta a variável 'pesquisa' e faz a busca automática após 300ms sem digitar
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
      
      let endpoint = `/catalogo?page=${numeroPagina}&categoria_id=${catId}&search=${encodeURIComponent(termoPesquisa)}`;
      
      if (temReservaAtiva) {
        endpoint += `&start_date=${reserva.dataInicio}&end_date=${reserva.dataFim}`;
      }

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
          setCategoriasDB([
            { id: 'Todos', description: 'Todos' }, 
            { id: 'Kits', description: 'Kits' },
            ...novosDados.categorias
          ]);
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
    // Não limpamos a lista abruptamente para evitar o piscar visual
    carregarCatalogo(1, idCategoria, pesquisa); 
  };

  const aoChegarAoFimDaLista = () => {
    if (!loadingMore && temMaisPaginas) {
      carregarCatalogo(paginaAtual + 1, categoriaAtiva, pesquisa);
    }
  };

  const BadgeDisponibilidade = ({ quantidade }: { quantidade: number }) => {
    if (quantidade === 0) {
      return (
        <View style={[styles.badge, { backgroundColor: '#F0F0F0' }]}>
          <Text style={[styles.badgeText, { color: '#9E9E9E' }]}>Esgotado</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
        <Text style={[styles.badgeText, { color: '#2E7D32' }]}>{quantidade} disp.</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />; 
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#065294" /> 
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList 
        data={equipamentosItens}
        keyExtractor={(item, index) => String(item.id) + index}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        
        ListHeaderComponent={
          <View style={{ paddingBottom: 15 }}>
            
            {/* CONTAINER BRANCO DO HEADER COMPACTO */}
            <View style={styles.headerBrancoContainer}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.saudacao}>Olá</Text>
                  <Text style={styles.nomeUtilizador}>{userName}</Text> 
                </View>
                <TouchableOpacity 
                  style={styles.avatarContainer} 
                  onPress={() => router.push('/perfil')} 
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.imageAvatar} />
                  ) : (
                    <Text style={styles.avatarText}>{userInitials}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* BARRA DE PESQUISA */}
              <View style={styles.pesquisaContainer}>
                <Ionicons name="search-outline" size={20} color="#9E9E9E" style={styles.pesquisaIcone} />
                <TextInput
                  style={styles.pesquisaInput}
                  placeholder="Pesquisar equipamento ou modelo..."
                  placeholderTextColor="#9E9E9E"
                  value={pesquisa}
                  onChangeText={(texto) => setPesquisa(texto)}
                  returnKeyType="search"
                />
                {pesquisa.length > 0 && (
                  <TouchableOpacity onPress={() => setPesquisa('')}>
                    <Ionicons name="close-circle" size={18} color="#B0BEC5" />
                  </TouchableOpacity>
                )}
              </View>
              

              {/* FILTROS / CHIPS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                {categoriasDB.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.chip, categoriaAtiva === cat.id && styles.chipActive]}
                    onPress={() => mudarCategoria(cat.id)}
                  >
                    <Text style={[styles.chipText, categoriaAtiva === cat.id && styles.chipTextActive]}>
                      {cat.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mostra um mini-loader discreto abaixo do bloco branco se estiver a carregar */}
            {loadingInitial && (
              <ActivityIndicator size="small" color="#065294" style={{ marginVertical: 15 }} />
            )}

            {/* DESTAQUES DOS KITS RECUPERADOS (Aparece fora do bloco branco no fundo azulado) */}
            {destaquesKits.length > 0 && pesquisa.length === 0 && (
              <>
                <Text style={styles.sectionTitle}>EM DESTAQUE (KITS)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destaquesContainer} >
                  {destaquesKits.map((kit) => (
                  <TouchableHighlight 
                    key={kit.id} 
                    underlayColor="#F5F5F5" 
                    style={{ borderRadius: 16, marginRight: 15 }} // MARGIN ADICIONADA AQUI para separar os touchables
                    onPress={() => router.push(`/detalhes/${kit.id}`)}
                  >
                    {/* Remove o marginRight do cardDestaque interno para não dar conflito */}
                    <View style={[styles.cardDestaque, { marginRight: 0 }]}>
                      {kit.image ? (
                        <Image source={{ uri: obterUrlImagem(kit.image) }} style={styles.imagemDestaqueMock} />
                      ) : (
                        <View style={[styles.imagemDestaqueMock, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                          <Ionicons name="camera-outline" size={30} color="#B0BEC5" />
                        </View>
                      )}
                      <Text style={styles.cardTitulo} numberOfLines={1}>{kit.nome || kit.name}</Text>
                      <Text style={styles.cardSubtitulo} numberOfLines={1}>{kit.description || kit.model}</Text>
                      <BadgeDisponibilidade quantidade={kit.kit_unities_count || kit.item_unities_count || 0} />
                    </View>
                  </TouchableHighlight>
                ))}
                </ScrollView>
              </>
            )}

            {/* TÍTULO DINÂMICO DA LISTA DE PRODUTOS */}
            <Text style={styles.sectionTitle}>
              {categoriaAtiva === 'Todos' ? 'TODOS OS EQUIPAMENTOS' : 
              categoriaAtiva === 'Kits'   ? 'TODOS OS KITS' : String(categoriasDB.find(cat => cat.id === categoriaAtiva)?.description || 'EQUIPAMENTOS FILTRADOS').toUpperCase()}
            </Text>

          </View> 
        }
       
        renderItem={({ item }) => (
          <TouchableHighlight 
            underlayColor="#F5F5F5"
            style={{ borderRadius: 16, marginHorizontal: 20, marginBottom: 12 }} 
            onPress={() => router.push(`/detalhes/${item.id}`)}
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
                <Text style={styles.cardTitulo} numberOfLines={1}>{item.nome}</Text>
                <Text style={styles.cardSubtitulo} numberOfLines={1}>{item.model}</Text>
              </View>
              <BadgeDisponibilidade quantidade={item.item_unities_count || 0} />
            </View>
          </TouchableHighlight>
        )}
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
  
  
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
   container: { paddingBottom: 100, backgroundColor: '#f4f7fc' },
  headerBrancoContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 16,
    borderColor: '#e2e8f0',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 15 
  },
  pesquisaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f7fc', // Um tom mais claro para destacar dentro do fundo branco
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pesquisaIcone: {
    marginRight: 10,
  },
  pesquisaInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    height: '100%',
  },
  chipsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, // Garante o alinhamento inicial na mesma posição
    marginTop: 15, 
  },
 
  
  saudacao: { fontSize: 12, color: '#9E9E9E', fontWeight: 'bold' },
  nomeUtilizador: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  avatarContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#065294', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, 
  imageAvatar: { width: 45, height: 45, borderRadius: 22.5 }, 
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
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
  categoriasContainer: { paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  categoriaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', marginRight: 10, borderWidth: 1, borderColor: '#EEEEEE' },
  categoriaBtnAtiva: { backgroundColor: '#065294', borderColor: '#065294' },
  categoriaText: { color: '#757575', fontWeight: '600', fontSize: 13 },
  categoriaTextAtiva: { color: '#FFF' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#9E9E9E', marginHorizontal: 20, marginTop: 20, marginBottom: 15, letterSpacing: 0.5 },
  destaquesContainer: { paddingLeft: 20 },
  cardDestaque: { width: 160, backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 10 },
  
  /* CORREÇÃO: imagemDestaqueMock adicionada aos estilos! */
  imagemDestaqueMock: { width: '100%', height: 100, backgroundColor: '#E8EAF6', borderRadius: 10, marginBottom: 12 },
  
  cardTitulo: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  cardSubtitulo: { fontSize: 12, color: '#757575', marginBottom: 10 },
  cardLista: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 0, marginBottom: 0, padding: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imagemListaMock: { width: 60, height: 60, backgroundColor: '#E8EAF6', borderRadius: 10, marginRight: 15 },
  listaTextoInfo: { flex: 1, justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

});