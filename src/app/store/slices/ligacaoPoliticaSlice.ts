import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SubTab {
  kind: 'consulta' | 'ad';
  id: number;
}

interface LpCachedItem {
  id: number;
  data?: any;
  licitacoes?: any[];
  [key: string]: any;
}

interface LpResultadoItem {
  cpf_cnpj?: string;
  numero_controle_pncp?: string;
  documentos?: Array<{ vinculos?: any[] }>;
  [key: string]: any;
}

interface LpResultados {
  resultados: LpResultadoItem[];
  [key: string]: any;
}

interface LpDataCacheValue {
  data: any;
  licitacoes: any[];
  timestamp: number;
}

interface LigacaoPoliticaState {
  subTabs: SubTab[];
  subTabAtiva: string;
  ligPoliticaAberta: LpCachedItem | null;
  ligPoliticaCache: LpCachedItem[];
  lpResultados: LpResultados | null;
  lpDataCache: Record<string, LpDataCacheValue>;
  lpFromPanel: boolean;
}

const initialState: LigacaoPoliticaState = {
  subTabs: [],
  subTabAtiva: 'geral',
  ligPoliticaAberta: null,
  ligPoliticaCache: [],
  lpResultados: null,
  lpDataCache: {},
  lpFromPanel: false,
};

const ligacaoPoliticaSlice = createSlice({
  name: 'ligacaoPolitica',
  initialState,
  reducers: {
    setSubTabAtiva(state, action: PayloadAction<string>) {
      state.subTabAtiva = action.payload;
    },
    addSubTab(state, action: PayloadAction<SubTab>) {
      if (!state.subTabs.some((t) => t.kind === action.payload.kind && t.id === action.payload.id)) {
        state.subTabs.push(action.payload);
      }
    },
    removeSubTab(state, action: PayloadAction<string>) {
      const idx = state.subTabs.findIndex((t) => {
        const key = t.kind === 'consulta' ? `consulta-${t.id}` : 'ad';
        return key === action.payload;
      });
      if (idx !== -1) {
        state.subTabs.splice(idx, 1);
      }
      if (state.subTabAtiva === action.payload) {
        state.subTabAtiva = state.subTabs.length > 0
          ? state.subTabs[state.subTabs.length - 1].kind === 'consulta'
            ? `consulta-${state.subTabs[state.subTabs.length - 1].id}`
            : 'ad'
          : 'geral';
      }
    },
    reorderSubTabs(state, action: PayloadAction<{ from: number; to: number }>) {
      const { from, to } = action.payload;
      const [item] = state.subTabs.splice(from, 1);
      state.subTabs.splice(to, 0, item);
    },
    setLigPoliticaAberta(state, action: PayloadAction<LpCachedItem | null>) {
      state.ligPoliticaAberta = action.payload;
    },
    setLigPoliticaCache(state, action: PayloadAction<LpCachedItem[]>) {
      state.ligPoliticaCache = action.payload;
    },
    addLigPoliticaCache(state, action: PayloadAction<LpCachedItem>) {
      state.ligPoliticaCache = [action.payload, ...state.ligPoliticaCache];
    },
    updateLigPoliticaCache(state, action: PayloadAction<{ id: number; data: any }>) {
      state.ligPoliticaCache = state.ligPoliticaCache.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload.data } : c
      );
    },
    removeLigPoliticaCache(state, action: PayloadAction<number>) {
      state.ligPoliticaCache = state.ligPoliticaCache.filter((c) => c.id !== action.payload);
    },
    setLpResultados(state, action: PayloadAction<LpResultados | null>) {
      state.lpResultados = action.payload;
    },
    setLpDataCache(state, action: PayloadAction<Record<string, LpDataCacheValue>>) {
      state.lpDataCache = action.payload;
    },
    setSubTabs(state, action: PayloadAction<SubTab[]>) {
      state.subTabs = action.payload;
    },
    setLpFromPanel(state, action: PayloadAction<boolean>) {
      state.lpFromPanel = action.payload;
    },
  },
});

export const {
  setSubTabAtiva,
  addSubTab,
  removeSubTab,
  reorderSubTabs,
  setLigPoliticaAberta,
  setLigPoliticaCache,
  addLigPoliticaCache,
  updateLigPoliticaCache,
  removeLigPoliticaCache,
  setLpResultados,
  setLpDataCache,
  setSubTabs,
  setLpFromPanel,
} = ligacaoPoliticaSlice.actions;
export default ligacaoPoliticaSlice.reducer;
