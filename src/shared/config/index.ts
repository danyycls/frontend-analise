export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const WS_BASE_URL: string = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';

export const P2_API_BASE_URL: string = import.meta.env.VITE_P2_API_BASE_URL || 'http://localhost:8084';

export const P2_WS_BASE_URL: string = import.meta.env.VITE_P2_WS_BASE_URL || 'ws://localhost:8084';

export const TOPO_URL: string = import.meta.env.VITE_TOPO_URL || '';

export const COUNTRY_TOPO_URL: string = import.meta.env.VITE_COUNTRY_TOPO_URL || 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json';
