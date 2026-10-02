import { apiFetch, apiUpload, apiFetchBlob } from '@/lib/http';
import type { CompagnieDocument, TypeDocument, StatutDocument } from './types';

export const documentsApi = {
  list: (compagnieId: number) => apiFetch<CompagnieDocument[]>(`/compagnies/${compagnieId}/documents`),

  uploader: (compagnieId: number, type: TypeDocument, fichier: File) => {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('document', fichier);
    return apiUpload<CompagnieDocument>(`/compagnies/${compagnieId}/documents`, fd);
  },

  telecharger: (compagnieId: number, docId: number) =>
    apiFetchBlob(`/compagnies/${compagnieId}/documents/${docId}/fichier`),

  supprimer: (compagnieId: number, docId: number) =>
    apiFetch<void>(`/compagnies/${compagnieId}/documents/${docId}`, { method: 'DELETE' }),

  /** Admin uniquement (perm compagnie:moderate). */
  moderer: (compagnieId: number, docId: number, statut: StatutDocument, commentaireAdmin?: string) =>
    apiFetch<CompagnieDocument>(`/compagnies/${compagnieId}/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut, commentaireAdmin }),
    }),
};
