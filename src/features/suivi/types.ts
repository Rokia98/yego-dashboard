export type PositionGps = {
  latitude: number;
  longitude: number;
  vitesse: number | null;
  cap: number | null;
  precision?: number | null;
  mesureA: string;
  ageSecondes?: number;
  fraiche?: boolean;
};

export type SuiviEta = {
  arriveeEstimee: string;
  minutesRestantes: number;
  distanceKm: number;
  retardMinutes: number;
};

export type SuiviDepart = {
  departId: number;
  statut: string;
  demarreA: string | null;
  termineA: string | null;
  derniere: PositionGps | null;
  destination: { ville: string; latitude: number; longitude: number } | null;
  heureArriveePrevue: string | null;
  eta: SuiviEta | null;
  retard: boolean;
};

export type SuiviHistorique = {
  departId: number;
  points: Pick<PositionGps, 'latitude' | 'longitude' | 'vitesse' | 'cap' | 'mesureA'>[];
};

export type DemarrageDepart = {
  suiviToken: string;
  expireA: string;
};
