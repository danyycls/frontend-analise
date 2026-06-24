import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SubTab {
  kind: 'consulta' | 'ad';
  id: number;
}

interface LigacaoPoliticaState {
  subTabs: SubTab[];
  subTabAtiva: string;
  ligPoliticaAberta: unknown | null;
  ligPoliticaCache: unknown[];
  lpResultados: unknown | null;
  lpDataCache: Record<string, unknown>;
  adTabAtiva: string;
  adAnalises: unknown[];
  panelLicitacoes: unknown[];
  lpFromPanel: boolean;
}

const initialState: LigacaoPoliticaState = {
  subTabs: [],
  subTabAtiva: 'geral',
  ligPoliticaAberta: null,
  ligPoliticaCache: [],
  lpResultados: null,
  lpDataCache: {},
  adTabAtiva: 'geral',
  adAnalises: [],
  panelLicitacoes: [],
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
    setLigPoliticaAberta(state, action: PayloadAction<unknown | null>) {
      state.ligPoliticaAberta = action.payload;
    },
    setLigPoliticaCache(state, action: PayloadAction<unknown[]>) {
      state.ligPoliticaCache = action.payload;
    },
    addLigPoliticaCache(state, action: PayloadAction<unknown>) {
      state.ligPoliticaCache = [action.payload, ...state.ligPoliticaCache];
    },
    updateLigPoliticaCache(state, action: PayloadAction<{ id: number; data: unknown }>) {
      state.ligPoliticaCache = state.ligPoliticaCache.map((c: any) =>
        c.id === action.payload.id ? { ...c, ...(action.payload.data as any) } : c
      );
    },
    removeLigPoliticaCache(state, action: PayloadAction<number>) {
      state.ligPoliticaCache = state.ligPoliticaCache.filter((c: any) => c.id !== action.payload);
    },
    setLpResultados(state, action: PayloadAction<unknown | null>) {
      state.lpResultados = action.payload;
    },
    setLpDataCache(state, action: PayloadAction<Record<string, unknown>>) {
      state.lpDataCache = action.payload;
    },
    setAdTabAtiva(state, action: PayloadAction<string>) {
      state.adTabAtiva = action.payload;
    },
    setAdAnalises(state, action: PayloadAction<unknown[]>) {
      state.adAnalises = action.payload;
    },
    addAdAnalise(state, action: PayloadAction<unknown>) {
      state.adAnalises = [...state.adAnalises, action.payload];
    },
    removeAdAnalise(state, action: PayloadAction<number>) {
      state.adAnalises = state.adAnalises.filter((a: any) => a.id !== action.payload);
    },
    setSubTabs(state, action: PayloadAction<SubTab[]>) {
      state.subTabs = action.payload;
    },
    setPanelLicitacoes(state, action: PayloadAction<unknown[]>) {
      state.panelLicitacoes = action.payload;
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
  setAdTabAtiva,
  setAdAnalises,
  addAdAnalise,
  removeAdAnalise,
  setSubTabs,
  setPanelLicitacoes,
  setLpFromPanel,
} = ligacaoPoliticaSlice.actions;
export default ligacaoPoliticaSlice.reducer;
