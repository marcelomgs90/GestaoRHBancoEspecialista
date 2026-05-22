/**
 * Tipos do prototipo legacy (mock) — em uso ate a Etapa 6 substituir cada pagina
 * pelos tipos reais do backend (`@/types/{auth,projeto,solicitacao,enums}`).
 */

export enum UserRole {
  GESTOR = 'GESTOR',
  COORDENADOR = 'COORDENADOR',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isServidor: boolean;
}

export interface ScholarshipTable {
  id: string;
  version: string;
  active: boolean;
  categories: {
    junior: number;
    pleno: number;
    master: number;
  };
}

export interface ProjectResource {
  source: string;
  value: number;
}

export interface Project {
  id: string;
  title: string;
  acronym: string;
  objectDescription: string;
  startDate: string;
  endDate: string;
  companies: string[];
  resources: ProjectResource[];
  piRule: 'EXCLUSIVA_EMPRESA' | 'COMPARTILHADA' | 'EXCLUSIVA_IF';
  annexes: string[];
  coordinatorId: string;
  totalValue: number;
}

export interface HRMember {
  id: string;
  name: string;
  projectId: string;
  role: string;
  category: 'Junior' | 'Pleno' | 'Master';
  startDate: string;
  endDate: string;
  hoursPerMonth: number;
  paymentSource: string[];
  scholarshipValue: number;
  installments: number;
  source: 'PROCESS_SELECT' | 'SPECIALIST_BANK';
}

export interface Specialist {
  id: string;
  name: string;
  email: string;
  isServidor: boolean;
  currentWorkload: number;
}

export interface Candidate {
  id: string;
  name: string;
  score: number;
  suggestedCategory: 'Junior' | 'Pleno' | 'Master';
}
