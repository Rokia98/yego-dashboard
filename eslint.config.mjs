import coreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...coreWebVitals,
  {
    // Règles « React Compiler » arrivées avec React 19 / eslint-config-next 16 :
    // elles signalent des motifs qui fonctionnent (setState dans un effet, ref
    // lue au rendu…). Gardées visibles en avertissement, à traiter au fil de
    // l'eau plutôt que dans une refonte d'un bloc.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default config;
