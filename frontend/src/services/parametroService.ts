import { api } from './api';
import { CategoriaBolsa, FonteFinanciamento } from '@/types/enums';
import type { AlocacaoConcorrente, ResumoPesquisador } from '@/types/solicitacao';

// --- Tipos para gestão de tabelas (BolsaManagement - sem endpoint ainda) ---
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

// --- Tipos para preview de cálculo/validação ---
export interface CalcularBolsaRequest {
  categoria: CategoriaBolsa;
  carga_horaria_semanal: number;
  data_referencia: string; // ISO date
  data_fim?: string; // ISO date (opcional)
}

export interface CalcularBolsaResponse {
  /** Sinônimo de `valor_mensal`, mantido por compatibilidade. */
  valor: number;
  /** Valor integral mensal (proporcional à CH semanal). */
  valor_mensal: number;
  /** Valor proporcional ao período (data_inicio → data_fim). Igual ao mensal quando `data_fim` é vazio. */
  valor_periodo: number;
  /** Valor/hora médio: `valor_mensal / carga_horaria_semanal`. */
  valor_hora: number;
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
  /** Detalhe de cada alocação vigente concorrente em outro projeto. */
  alocacoes_concorrentes: AlocacaoConcorrente[];
  mensagem?: string;
}

export interface ResumoPesquisadorRequest {
  ref_pesquisador: string;
  data_inicio?: string;
  data_fim?: string;
}

export const parametroService = {
  // --- Preview em tempo real ---
  async calcularBolsa(dados: CalcularBolsaRequest): Promise<CalcularBolsaResponse> {
    const response = await api.post<CalcularBolsaResponse>('/parametros/calcular-bolsa', dados);
    return response.data;
  },

  async validarChGlobal(dados: ValidarChGlobalRequest): Promise<ValidarChGlobalResponse> {
    const response = await api.post<ValidarChGlobalResponse>('/parametros/validar-ch-global', dados);
    return response.data;
  },

  /** Visão consolidada por pesquisador: alocações vigentes + agregados. */
  async resumoPesquisador(dados: ResumoPesquisadorRequest): Promise<ResumoPesquisador> {
    const params: Record<string, string> = { ref_pesquisador: dados.ref_pesquisador };
    if (dados.data_inicio) params.data_inicio = dados.data_inicio;
    if (dados.data_fim) params.data_fim = dados.data_fim;
    const response = await api.get<ResumoPesquisador>('/parametros/resumo-pesquisador', {
      params,
    });
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
