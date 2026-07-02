import React, { createContext, ReactNode, useContext, useState } from 'react';

// 1. Definir a estrutura de um Item/Kit dentro da reserva
export interface ItemReserva {
  id: number;
  nome?: string;
  name?: string; // para kits se usarem 'name'
  is_kit: boolean;
  price_day?: number | string | null;
  quantidadeSelecionada: number;
  [key: string]: any; // Permite outras propriedades dinâmicas do item
}

// 2. Definir a estrutura do Estado da Reserva
export interface EstadoReserva {
  dataInicio: string;
  dataFim: string;
  motivo: string;
  curso: string;
  centroCusto: string | number;
  isCiclica: boolean;
  diaCiclico: number | string | null;
  itens: ItemReserva[];
}

// 3. Definir o que o Contexto vai exportar para os ecrãs
interface ReservaContextType {
  reserva: EstadoReserva;
  iniciarReserva: (dadosIniciais: Partial<EstadoReserva>) => void;
  adicionarItem: (item: any, quantidade: number) => void;
  removerItem: (itemId: number, isKit: boolean) => void;
  limparReserva: () => void;
  temReservaAtiva: boolean;
}

// Correção do erro 1: Passar valor inicial e tipar o Contexto
const ReservaContext = createContext<ReservaContextType | undefined>(undefined);

const estadoInicial: EstadoReserva = {
  dataInicio: '',
  dataFim: '',
  motivo: '',
  curso: '',
  centroCusto: '',
  isCiclica: false,
  diaCiclico: null,
  itens: [] // Correção do erro 4: Agora o TS sabe que este array receberá itens
};

// Correção do erro 2: Tipar o children usando ReactNode
export function ReservaProvider({ children }: { children: ReactNode }) {
  const [reserva, setReserva] = useState<EstadoReserva>(estadoInicial);

  // Correção do erro 3: dadosIniciais tipados como Partial do estado
  const iniciarReserva = (dadosIniciais: Partial<EstadoReserva>) => {
    setReserva({
      ...estadoInicial,
      ...dadosIniciais,
      itens: []
    } as EstadoReserva);
  };

  const adicionarItem = (item: any, quantidade: number) => {
    setReserva((reservaAtual) => {
      const itemExistenteIndex = reservaAtual.itens.findIndex(
        (i) => i.id === item.id && i.is_kit === item.is_kit
      );

      let novosItens = [...reservaAtual.itens];

      if (itemExistenteIndex > -1) {
        novosItens[itemExistenteIndex].quantidadeSelecionada = quantidade;
      } else {
        novosItens.push({
          ...item,
          quantidadeSelecionada: quantidade
        });
      }

      return { ...reservaAtual, itens: novosItens };
    });
  };

  const removerItem = (itemId: number, isKit: boolean) => {
    setReserva((reservaAtual) => ({
      ...reservaAtual,
      itens: reservaAtual.itens.filter((i) => !(i.id === itemId && i.is_kit === isKit))
    }));
  };

  const limparReserva = () => {
    setReserva(estadoInicial);
  };

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

export function useReserva() {
  const context = useContext(ReservaContext);
  if (!context) {
    throw new Error('useReserva deve ser usado dentro de um ReservaProvider');
  }
  return context;
}