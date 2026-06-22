const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL || 'ws://localhost:8080';
export const TOPO_URL = import.meta.env.VITE_TOPO_URL || 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&intrarregiao=UF&qualidade=intermediaria&nivel=1';
export default API_BASE_URL;
