import { api } from './api';
import { CategoriaBolsa, FonteFinanciamento } from '@/types/enums';

// --- Tipos para gestao de tabelas (BolsaManagement - sem endpoint ainda) ---
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

const TODO_MSG = 'TODO: endpoint /parametros (CRUD de tabelas) nao implementado no backend ainda';

// --- Tipos para preview de calculo/validacao (US-SD-03) ---
export interface CalcularBolsaRequest {
  categoria: CategoriaBolsa;
  carga_horaria_semanal: number;
  data_referencia: string; // ISO date
}

export interface CalcularBolsaResponse {
  valor: number;
  categoria: CategoriaBolsa;
  carga_horaria_semanal: number;
}

export interface ValidarChGlobalRequest {
  ref_pesquisador: string;
  carga_horaria_semanal: number;
  data_inicio: string;
  data_fim?: string;
  membro_id_excluir?: number;
  projeto_id_excluir?: number;
}

export interface ValidarChGlobalResponse {
  valido: boolean;
  ch_alocada_em_outros_projetos: number;
  ch_proposta: number;
  ch_total: number;
  limite_semanal: number;
  mensagem?: string;
}

export const parametroService = {
  // --- Preview em tempo real (US-SD-03) ---
  async calcularBolsa(dados: CalcularBolsaRequest): Promise<CalcularBolsaResponse> {
    const response = await api.post<CalcularBolsaResponse>('/parametros/calcular-bolsa', dados);
    return response.data;
  },

  async validarChGlobal(dados: ValidarChGlobalRequest): Promise<ValidarChGlobalResponse> {
    const response = await api.post<ValidarChGlobalResponse>('/parametros/validar-ch-global', dados);
    return response.data;
  },

  // --- CRUD de tabelas (sem endpoint ainda) ---
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
