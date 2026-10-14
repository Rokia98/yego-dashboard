import { apiFetch } from '@/lib/http';
import type { Agent } from './types';

export type CreateAgentInput = {
  nom: string;
  telephone: string;
  motDePasse: string;
  email?: string;
  compagnieId?: number;
};

// motDePasse : réinitialisation par le gestionnaire → mot de passe provisoire, à changer
// à la 1re connexion. Réinitialiser ou désactiver (actif: false) coupe toutes les sessions de l'agent.
export type UpdateAgentInput = Partial<Omit<CreateAgentInput, 'compagnieId'>> & { actif?: boolean };

export const agentsApi = {
  list: ({ take = 100, skip = 0 }: { take?: number; skip?: number } = {}) =>
    apiFetch<Agent[]>(`/agents?take=${take}&skip=${skip}`),
  create: (data: CreateAgentInput) =>
    apiFetch<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateAgentInput) =>
    apiFetch<Agent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/agents/${id}`, { method: 'DELETE' }),
};
