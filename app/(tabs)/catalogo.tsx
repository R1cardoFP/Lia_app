import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function Catalogo() {
  // O estado agora guarda objetos reais: { id: 1, description: 'Câmaras' }
  const [categoriasDB, setCategoriasDB] = useState([{ id: 'Todos', description: 'Todos' }]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  
  const [destaquesKits, setDestaquesKits] = useState([]);
  const [equipamentosItens, setEquipamentosItens] = useState([]);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [temMaisPaginas, setTemMaisPaginas] = useState(true);

  useEffect(() => {
    carregarCatalogo(1, 'Todos');
  }, []);

  // Adicionámos o parâmetro catId para sabermos o que pedir ao Laravel
  const carregarCatalogo = async (numeroPagina, catId = categoriaAtiva) => {
    if (loadingMore) return;
    if (numeroPagina > 1 && !temMaisPaginas) return;

    try {
      if (numeroPagina === 1) setLoadingInitial(true);
      else setLoadingMore(true);

      const token = await AsyncStorage.getItem('userToken');
      
      // Enviamos a página e a categoria escolhida
      const response = await api.get(`/catalogo?page=${numeroPagina}&categoria_id=${catId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const novosDados = response.data.data;
        
        // Se for a página 1 e o Laravel mandou categorias, guardamo-las!
        if (numeroPagina === 1 && novosDados.categorias) {
          setCategoriasDB([
            { id: 'Todos', description: 'Todos' }, 
            { id: 'Kits', description: 'Kits' },
            ...novosDados.categorias]);
        }
        
        if (numeroPagina === 1) {
          setDestaquesKits(novosDados.kits);
          setEquipamentosItens(novosDados.itens);
        } else {
          setEquipamentosItens(listaAntiga => [...listaAntiga, ...novosDados.itens]);
        }

        setPaginaAtual(novosDados.paginacao.pagina_atual);
        setTemMaisPaginas(novosDados.paginacao.tem_mais);
      }
    } catch (error) {
      console.log('Erro ao carregar catálogo:', error);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  const mudarCategoria = (idCategoria) => {
    setCategoriaAtiva(idCategoria);
    setTemMaisPaginas(true);
    setEquipamentosItens([]); // Esvazia a lista antiga visualmente
    carregarCatalogo(1, idCategoria); // Pede a página 1 da nova categoria
  };

  const aoChegarAoFimDaLista = () => {
    if (!loadingMore && temMaisPaginas) {
      carregarCatalogo(paginaAtual + 1, categoriaAtiva);
    }
  };

  const BadgeDisponibilidade = ({ quantidade }) => {
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

  if (loadingInitial && equipamentosItens.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={{ paddingBottom: 15 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>BOM DIA</Text>
          <Text style={styles.nomeUtilizador}>Guilherme Magalhães</Text> 
        </View>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={() => router.push('/perfil')} // <-- ATIRA PARA O PERFIL
        >
          <Text style={styles.avatarText}>GM</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasContainer}>
        {/* Renderiza as categorias reais da Base de Dados */}
        {categoriasDB.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.categoriaBtn, categoriaAtiva === cat.id && styles.categoriaBtnAtiva]}
            onPress={() => mudarCategoria(cat.id)}
          >
            <Text style={[styles.categoriaText, categoriaAtiva === cat.id && styles.categoriaTextAtiva]}>
              {cat.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Os destaques (kits) só aparecem se existirem (ex: no separador "Todos") */}
      {destaquesKits.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>EM DESTAQUE (KITS)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destaquesContainer}>
            {destaquesKits.map((kit) => (
              <View key={kit.id} style={styles.cardDestaque}>
                <View style={styles.imagemDestaqueMock} />
                <Text style={styles.cardTitulo} numberOfLines={1}>{kit.name}</Text>
                <Text style={styles.cardSubtitulo} numberOfLines={1}>{kit.description}</Text>
                <BadgeDisponibilidade quantidade={kit.kit_unities_count} />
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionTitle}>
        {categoriaAtiva === 'Todos' ? 'TODOS OS EQUIPAMENTOS' : 
         categoriaAtiva === 'Kits'  ? 'TODOS OS KITS' : 'EQUIPAMENTOS FILTRADOS'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />; 
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#1A237E" />
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
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.cardLista}>
            <View style={styles.imagemListaMock} />
            <View style={styles.listaTextoInfo}>
              <Text style={styles.cardTitulo} numberOfLines={1}>{item.nome}</Text>
              <Text style={styles.cardSubtitulo} numberOfLines={1}>{item.model}</Text>
            </View>
            <BadgeDisponibilidade quantidade={item.item_unities_count} />
          </View>
        )}
        onEndReached={aoChegarAoFimDaLista}
        onEndReachedThreshold={0.1} 
        ListFooterComponent={renderFooter}
        
        // Esta listEmptyComponent é mostrada caso a categoria não tenha nenhum equipamento
        ListEmptyComponent={!loadingInitial && (
          <Text style={{ textAlign: 'center', color: '#9E9E9E', marginTop: 20 }}>
            Nenhum equipamento encontrado nesta categoria.
          </Text>
        )}
      />
    </SafeAreaView>
  );
}

// ... MATÉM EXATAMENTE O MESMO bloco de `const styles = StyleSheet.create({...` AQUI

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  saudacao: {
    color: '#00BFA5', 
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
  },
  nomeUtilizador: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#1A237E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoriasContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  categoriaBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    marginRight: 10,
    height: 40,
    justifyContent: 'center',
  },
  categoriaBtnAtiva: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
  },
  categoriaText: {
    color: '#757575',
    fontWeight: '600',
  },
  categoriaTextAtiva: {
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#546E7A',
    marginBottom: 15,
  },
  destaquesContainer: {
    marginBottom: 30,
  },
  cardDestaque: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // ATENÇÃO: Ajustámos o cardLista para ele próprio ter o fundo branco
  cardLista: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imagemListaMock: {
    width: 50,
    height: 50,
    backgroundColor: '#E8F5E9', 
    borderRadius: 10,
    marginRight: 15,
  },
  listaTextoInfo: {
    flex: 1,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 2,
  },
  cardSubtitulo: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});