import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import type { ProgressLog } from '@/features/licitacao/api/progress-hooks';

export interface Consulta {
  id: number;
  timestamp: string;
  meta: Record<string, unknown>;
  resultados: unknown[];
}

export interface FilaItem {
  id: number;
  tipo: 'uf' | 'municipio' | 'orgao';
  valor: string;
  uf?: string;
  nome?: string;
  ano: string;
  trimestres: number[];
  dataInicial: string;
  dataFinal: string;
}

interface ProgressoState {
  processed: number;
  success: number;
  errors: number;
  log: ProgressLog[];
  stage: 'idle' | 'buscando' | 'processando' | 'concluido' | 'cancelado';
  concluido: boolean;
  cancelado: boolean;
  results: unknown[] | null;
  ultimoEvento: Record<string, unknown> | null;
  fetchProgresso: { concluidos: number; total: number } | null;
}

interface ConsultaState {
  consultas: Consulta[];
  progresso: ProgressoState;
  fila: FilaItem[];
}

const initialState: ConsultaState = {
  consultas: [],
  progresso: {
    processed: 0,
    success: 0,
    errors: 0,
    log: [],
    stage: 'idle',
    concluido: false,
    cancelado: false,
    results: null,
    ultimoEvento: null,
    fetchProgresso: null,
  },
  fila: [],
};

const consultaSlice = createSlice({
  name: 'consulta',
  initialState,
  reducers: {
    addConsulta(state, action: PayloadAction<Consulta>) {
      state.consultas = [action.payload, ...state.consultas];
    },
    removeConsulta(state, action: PayloadAction<number>) {
      state.consultas = state.consultas.filter((c) => c.id !== action.payload);
    },
    setConsultas(state, action: PayloadAction<Consulta[]>) {
      state.consultas = action.payload;
    },
    // Queue management
    addToFila(state, action: PayloadAction<FilaItem>) {
      state.fila.push(action.payload);
    },
    removeFromFila(state, action: PayloadAction<number>) {
      state.fila = state.fila.filter(f => f.id !== action.payload);
    },
    // Progress tracking
    setProgresso(state, action: PayloadAction<Partial<ProgressoState>>) {
      if (!state.progresso) {
        state.progresso = { ...initialState.progresso };
      }
      Object.assign(state.progresso, action.payload);
    },
    resetProgresso(state) {
      state.progresso = { ...initialState.progresso };
      state.fila = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: any) => {
      const incoming = action.payload?.consulta;
      if (incoming?.fila) {
        state.fila = incoming.fila.filter((f: any) => f.trimestres);
      }
    });
  },
});

export const {
  addConsulta, removeConsulta, setConsultas,
  addToFila, removeFromFila,
  setProgresso, resetProgresso,
} = consultaSlice.actions;
export default consultaSlice.reducer;
