import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProgressoState {
  atual: number;
  total: number;
  ano: number | null;
  status: 'idle' | 'buscando' | 'concluido' | 'erro';
}

export interface ErroSearch {
  ano: number;
  msg: string;
}

export interface BuscaEntry {
  id: string;
  label: string;
  codigosIBGE: string[];
  anos: number[];
  dados: any[];
  erros: ErroSearch[];
  busy: boolean;
  progresso: ProgressoState;
  concluido: boolean;
  totalRegistros: number;
}

interface RecursosMunicipioState {
  searches: Record<string, BuscaEntry>;
  activeSearchId: string | null;
}

const initialState: RecursosMunicipioState = {
  searches: {},
  activeSearchId: null,
};

const recursosMunicipioSlice = createSlice({
  name: 'recursosMunicipio',
  initialState,
  reducers: {
    addSearchStart(state, action: PayloadAction<{ id: string; label: string; codigosIBGE: string[]; anos: number[] }>) {
      const { id, label, codigosIBGE, anos } = action.payload;
      state.searches[id] = {
        id,
        label,
        codigosIBGE,
        anos,
        dados: [],
        erros: [],
        busy: true,
        progresso: { atual: 0, total: anos.length, ano: null, status: 'buscando' },
        concluido: false,
        totalRegistros: 0,
      };
      state.activeSearchId = id;
    },

    updateSearchProgress(state, action: PayloadAction<{ id: string; progresso: ProgressoState }>) {
      const entry = state.searches[action.payload.id];
      if (entry) {
        entry.progresso = action.payload.progresso;
      }
    },

    appendDados(state, action: PayloadAction<{ id: string; novos: any[] }>) {
      const entry = state.searches[action.payload.id];
      if (entry) {
        entry.dados = [...entry.dados, ...action.payload.novos];
        entry.totalRegistros = entry.dados.length;
      }
    },

    addErro(state, action: PayloadAction<{ id: string; erro: ErroSearch }>) {
      const entry = state.searches[action.payload.id];
      if (entry) {
        entry.erros.push(action.payload.erro);
      }
    },

    finishSearch(state, action: PayloadAction<{ id: string }>) {
      const entry = state.searches[action.payload.id];
      if (entry) {
        entry.busy = false;
        entry.concluido = true;
      }
    },

    removeYearFromSearch(state, action: PayloadAction<{ id: string; ano: number }>) {
      const entry = state.searches[action.payload.id];
      if (entry) {
        const { ano } = action.payload;
        entry.dados = entry.dados.filter(d => Math.floor(Number(d.mes_ano) / 100) !== ano);
        entry.anos = entry.anos.filter(a => a !== ano);
        entry.erros = entry.erros.filter(e => e.ano !== ano);
        entry.totalRegistros = entry.dados.length;
        if (entry.anos.length === 0 && !entry.busy) {
          entry.concluido = true;
          entry.progresso = { atual: 0, total: 0, ano: null, status: 'idle' };
        }
      }
    },

    removeSearch(state, action: PayloadAction<string>) {
      delete state.searches[action.payload];
      if (state.activeSearchId === action.payload) {
        const keys = Object.keys(state.searches);
        state.activeSearchId = keys.length > 0 ? keys[0] : null;
      }
    },

    setActiveSearch(state, action: PayloadAction<string | null>) {
      state.activeSearchId = action.payload;
    },
  },
});

export const {
  addSearchStart,
  updateSearchProgress,
  appendDados,
  addErro,
  finishSearch,
  removeYearFromSearch,
  removeSearch,
  setActiveSearch,
} = recursosMunicipioSlice.actions;

export default recursosMunicipioSlice.reducer;
