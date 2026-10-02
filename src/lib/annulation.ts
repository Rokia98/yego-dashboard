// Barème de remboursement appliqué par l'API sur PATCH /reservations/:id/annuler
// (frais retenus par la plateforme, calculés serveur selon le délai avant départ).
export const BAREME_ANNULATION = [
  { seuil: '3 jours ou plus avant le départ', frais: '10 % retenus' },
  { seuil: '1 à 2 jours avant', frais: '25 % retenus' },
  { seuil: 'le jour du départ', frais: '50 % retenus' },
  { seuil: 'après l’heure de départ', frais: 'aucun remboursement' },
] as const;

export function messageConfirmationAnnulation(payante: boolean): string {
  if (!payante) {
    return 'Annuler cette réservation ? Les places seront immédiatement libérées.';
  }
  return [
    'Annuler cette réservation payée ?',
    '',
    'Les places sont libérées et un remboursement est créé automatiquement,',
    'net des frais retenus selon le délai avant le départ :',
    '• 3 j ou plus : 10 % retenus',
    '• 1 à 2 j : 25 % retenus',
    '• jour J : 50 % retenus',
    '• départ passé : aucun remboursement',
    '',
    'Le versement au voyageur devra ensuite être confirmé depuis la page Remboursements.',
  ].join('\n');
}
