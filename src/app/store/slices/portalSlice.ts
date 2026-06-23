import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface MethodState {
  subs: number[];
  ativa: string;
}

interface PortalState {
  ptTopAba: string;
  ptMetodoState: Record<string, MethodState>;
}

const PT_METODOS = ['orgaos', 'pessoas', 'cartoes', 'servidores', 'despesas', 'emendas'] as const;

const initialState: PortalState = {
  ptTopAba: 'geral',
  ptMetodoState: Object.fromEntries(
    PT_METODOS.map((m) => [m, { subs: [], ativa: 'geral' }])
  ),
};

const portalSlice = createSlice({
  name: 'portal',
  initialState,
  reducers: {
    setPtTopAba(state, action: PayloadAction<string>) {
      state.ptTopAba = action.payload;
    },
    setPtMetodoAtiva(state, action: PayloadAction<{ method: string; ativa: string }>) {
      const { method, ativa } = action.payload;
      if (state.ptMetodoState[method]) {
        state.ptMetodoState[method].ativa = ativa;
      }
    },
    addPtSubTab(state, action: PayloadAction<{ method: string; id: number }>) {
      const { method, id } = action.payload;
      if (state.ptMetodoState[method] && !state.ptMetodoState[method].subs.includes(id)) {
        state.ptMetodoState[method].subs.push(id);
      }
    },
    removePtSubTab(state, action: PayloadAction<{ method: string; id: number }>) {
      const { method, id } = action.payload;
      const ms = state.ptMetodoState[method];
      if (ms) {
        ms.subs = ms.subs.filter((t) => t !== id);
        if (ms.ativa === `pt-${id}`) {
          ms.ativa = ms.subs.length > 0 ? `pt-${ms.subs[ms.subs.length - 1]}` : 'geral';
        }
      }
    },
    setPtMetodoState(state, action: PayloadAction<PortalState['ptMetodoState']>) {
      state.ptMetodoState = action.payload;
    },
  },
});

export const {
  setPtTopAba,
  setPtMetodoAtiva,
  addPtSubTab,
  removePtSubTab,
  setPtMetodoState,
} = portalSlice.actions;
export default portalSlice.reducer;
