import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Analise {
  id: number;
  timestamp: string;
  tipo: string;
  valor: string;
  ano: string;
  totalAnomalias: number;
}

export interface WorkerProgresso {
  type: string;
  message?: string;
  processed: number;
  total: number;
  success: number;
  errors: number;
  anomalias_encontradas: number;
  etapa_atual: string;
  documento?: string;
}

export interface ActiveAnalise {
  job_id: string;
  tipo: string;
  valor: string;
  ano: string;
  processando: boolean;
  concluido: boolean;
  etapa_atual: string;
  progresso: WorkerProgresso | null;
  totalAnomalias: number;
  mensagem: string;
  fetchProgresso: { concluidos: number; total: number };
}

export interface FilaItem {
  id: number;
  tipo: string;
  valor: string;
  ano: string;
  uf: string;
  codigoMunicipio: string;
  cnpjsSelecionados: string[];
  trimestres: number[];
  codigoModalidade: string;
}

interface AnomaliaState {
  analises: Analise[];
  active: ActiveAnalise | null;
  fila: FilaItem[];
}

const initialState: AnomaliaState = {
  analises: [],
  active: null,
  fila: [],
};

const anomaliaSlice = createSlice({
  name: 'anomalia',
  initialState,
  reducers: {
    addAnalise(state, action: PayloadAction<Analise>) {
      state.analises = [action.payload, ...state.analises];
    },
    removeAnalise(state, action: PayloadAction<number>) {
      state.analises = state.analises.filter(a => a.id !== action.payload);
    },
    setAnalises(state, action: PayloadAction<Analise[]>) {
      state.analises = action.payload;
    },
    setActiveAnalise(state, action: PayloadAction<ActiveAnalise | null>) {
      state.active = action.payload;
    },
    updateActiveAnalise(state, action: PayloadAction<Partial<ActiveAnalise>>) {
      if (state.active) {
        Object.assign(state.active, action.payload);
      }
    },
    addToFila(state, action: PayloadAction<FilaItem>) {
      state.fila = [...state.fila, action.payload];
    },
    removeFromFila(state, action: PayloadAction<number>) {
      state.fila = state.fila.filter(f => f.id !== action.payload);
    },
    clearFila(state) {
      state.fila = [];
    },
  },
});

export const { addAnalise, removeAnalise, setAnalises, setActiveAnalise, updateActiveAnalise, addToFila, removeFromFila, clearFila } = anomaliaSlice.actions;
export default anomaliaSlice.reducer;
