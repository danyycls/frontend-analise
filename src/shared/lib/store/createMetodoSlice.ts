import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface MethodState {
  subs: number[];
  ativa: string;
}

interface MetodoSliceState {
  topAba: string;
  metodoState: Record<string, MethodState>;
}

export function createMetodoSlice(name: string, metodos: readonly string[], prefix: string) {
  const initialState: MetodoSliceState = {
    topAba: 'geral',
    metodoState: Object.fromEntries(
      metodos.map((m) => [m, { subs: [], ativa: 'geral' }])
    ),
  };

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      setTopAba(state, action: PayloadAction<string>) {
        state.topAba = action.payload;
      },
      setMetodoAtiva(state, action: PayloadAction<{ method: string; ativa: string }>) {
        const { method, ativa } = action.payload;
        if (state.metodoState[method]) {
          state.metodoState[method].ativa = ativa;
        }
      },
      addSubTab(state, action: PayloadAction<{ method: string; id: number }>) {
        const { method, id } = action.payload;
        if (state.metodoState[method] && !state.metodoState[method].subs.includes(id)) {
          state.metodoState[method].subs.push(id);
        }
      },
      removeSubTab(state, action: PayloadAction<{ method: string; id: number }>) {
        const { method, id } = action.payload;
        const ms = state.metodoState[method];
        if (ms) {
          ms.subs = ms.subs.filter((t) => t !== id);
          if (ms.ativa === `${prefix}-${id}`) {
            ms.ativa = ms.subs.length > 0 ? `${prefix}-${ms.subs[ms.subs.length - 1]}` : 'geral';
          }
        }
      },
      reorderSubTabs(state, action: PayloadAction<{ method: string; from: number; to: number }>) {
        const { method, from, to } = action.payload;
        const ms = state.metodoState[method];
        if (ms) {
          const [item] = ms.subs.splice(from, 1);
          ms.subs.splice(to, 0, item);
        }
      },
      setMetodoState(state, action: PayloadAction<MetodoSliceState['metodoState']>) {
        state.metodoState = action.payload;
      },
    },
  });

  return slice;
}
