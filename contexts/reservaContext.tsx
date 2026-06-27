import React, { createContext, useContext, useState } from 'react';

const ReservaContext = createContext();

// Estrutura inicial de uma reserva vazia
const estadoInicial = {
  dataInicio: '',
  dataFim: '',
  motivo: '',
  curso: '',
  centroCusto: '',
  isCiclica: false,
  diaCiclico: '',
  itens: [] 
};

export function ReservaProvider({ children }) {
  const [reserva, setReserva] = useState(estadoInicial);

  // 1. Iniciar a reserva apenas com os dados do formulário (sem itens ainda)
  const iniciarReserva = (dadosIniciais) => {
    setReserva({
      ...estadoInicial,
      ...dadosIniciais,
      itens: []
    });
  };

  // 2. Adicionar um item ou kit ao carrinho da reserva
  const adicionarItem = (item, quantidade) => {
    setReserva((reservaAtual) => {
      // Verificar se o item já existe na reserva para não o duplicar na lista
      const itemExistenteIndex = reservaAtual.itens.findIndex(i => i.id === item.id && i.is_kit === item.is_kit);

      let novosItens = [...reservaAtual.itens];

      if (itemExistenteIndex > -1) {
        // Se já existe, apenas atualiza ou soma a quantidade
        novosItens[itemExistenteIndex].quantidadeSelecionada = quantidade;
      } else {
        // Se é novo, adiciona o objeto com a propriedade da quantidade escolhida
        novosItens.push({
          ...item,
          quantidadeSelecionada: quantidade
        });
      }

      return { ...reservaAtual, itens: novosItens };
    });
  };

  // 3. Remover um item específico da reserva
  const removerItem = (itemId, isKit) => {
    setReserva((reservaAtual) => ({
      ...reservaAtual,
      itens: reservaAtual.itens.filter(i => !(i.id === itemId && i.is_kit === isKit))
    }));
  };

  // 4. Cancelar ou limpar a reserva por completo (Reset)
  const limparReserva = () => {
    setReserva(estadoInicial);
  };

  // Verificar se existe uma sessão de reserva ativa a decorrer
  const temReservaAtiva = reserva.dataInicio !== '';

  return (
    <ReservaContext.Provider value={{
      reserva,
      iniciarReserva,
      adicionarItem,
      removerItem,
      limparReserva,
      temReservaAtiva
    }}>
      {children}
    </ReservaContext.Provider>
  );
}

// Hook personalizado para facilitar o uso nos ecrãs
export function useReserva() {
  const context = useContext(ReservaContext);
  if (!context) {
    throw new Error('useReserva deve ser usado dentro de um ReservaProvider');
  }
  return context;
}