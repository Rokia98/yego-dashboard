export type TypeDocument = 'registre_commerce' | 'autorisation_transport' | 'piece_identite_gerant' | 'autre';
export type StatutDocument = 'en_attente' | 'valide' | 'refuse';

export type CompagnieDocument = {
  id: number;
  compagnieId: number;
  type: TypeDocument;
  nomFichier: string;
  tailleOctets: number;
  mimeType: string;
  statut: StatutDocument;
  commentaireAdmin: string | null;
  dateUpload: string;
  dateRevue: string | null;
};

export const LABELS_TYPE_DOCUMENT: Record<TypeDocument, string> = {
  registre_commerce: 'Registre de commerce',
  autorisation_transport: 'Autorisation de transport',
  piece_identite_gerant: "Pièce d'identité du gérant",
  autre: 'Autre document',
};

export const TAILLE_MAX_OCTETS = 5 * 1024 * 1024; // 5 Mo
export const TYPES_MIME_ACCEPTES = ['application/pdf', 'image/png', 'image/jpeg'];
