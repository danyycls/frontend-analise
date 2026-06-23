import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface MethodState {
  subs: number[];
  ativa: string;
}

interface TseState {
  rpTopAba: string;
  rpMetodoState: Record<string, MethodState>;
}

const RP_METODOS = ['empresas', 'cargo', 'partido', 'doador', 'fornecedor'] as const;

const initialState: TseState = {
  rpTopAba: 'geral',
  rpMetodoState: Object.fromEntries(
    RP_METODOS.map((m) => [m, { subs: [], ativa: 'geral' }])
  ),
};

const tseSlice = createSlice({
  name: 'tse',
  initialState,
  reducers: {
    setRpTopAba(state, action: PayloadAction<string>) {
      state.rpTopAba = action.payload;
    },
    setRpMetodoAtiva(state, action: PayloadAction<{ method: string; ativa: string }>) {
      const { method, ativa } = action.payload;
      if (state.rpMetodoState[method]) {
        state.rpMetodoState[method].ativa = ativa;
      }
    },
    addRpSubTab(state, action: PayloadAction<{ method: string; id: number }>) {
      const { method, id } = action.payload;
      if (state.rpMetodoState[method] && !state.rpMetodoState[method].subs.includes(id)) {
        state.rpMetodoState[method].subs.push(id);
      }
    },
    removeRpSubTab(state, action: PayloadAction<{ method: string; id: number }>) {
      const { method, id } = action.payload;
      const ms = state.rpMetodoState[method];
      if (ms) {
        ms.subs = ms.subs.filter((t) => t !== id);
        if (ms.ativa === `rp-${id}`) {
          ms.ativa = ms.subs.length > 0 ? `rp-${ms.subs[ms.subs.length - 1]}` : 'geral';
        }
      }
    },
    reorderRpSubTabs(state, action: PayloadAction<{ method: string; from: number; to: number }>) {
      const { method, from, to } = action.payload;
      const ms = state.rpMetodoState[method];
      if (ms) {
        const [item] = ms.subs.splice(from, 1);
        ms.subs.splice(to, 0, item);
      }
    },
    setRpMetodoState(state, action: PayloadAction<TseState['rpMetodoState']>) {
      state.rpMetodoState = action.payload;
    },
  },
});

export const {
  setRpTopAba,
  setRpMetodoAtiva,
  addRpSubTab,
  removeRpSubTab,
  reorderRpSubTabs,
  setRpMetodoState,
} = tseSlice.actions;
export default tseSlice.reducer;
