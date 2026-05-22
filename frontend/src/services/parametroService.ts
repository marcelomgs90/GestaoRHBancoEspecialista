import { CategoriaBolsa, FonteFinanciamento } from '@/types/enums';

export interface TabelaBolsa {
  id: number;
  nome: string;
  fonte: FonteFinanciamento;
  vigencia_inicio: string;
  vigencia_fim?: string;
  valores: Array<{
    categoria: CategoriaBolsa;
    valor_referencia: number;
  }>;
}

const TODO_MSG = 'TODO: endpoint /parametros nao implementado no backend ainda';

export const parametroService = {
  async listarTabelas(): Promise<TabelaBolsa[]> {
    throw new Error(TODO_MSG);
  },

  async obterTabela(_id: number): Promise<TabelaBolsa> {
    throw new Error(TODO_MSG);
  },

  async criarTabela(_dados: Omit<TabelaBolsa, 'id'>): Promise<TabelaBolsa> {
    throw new Error(TODO_MSG);
  },

  async atualizarTabela(_id: number, _dados: Partial<TabelaBolsa>): Promise<TabelaBolsa> {
    throw new Error(TODO_MSG);
  },
};
