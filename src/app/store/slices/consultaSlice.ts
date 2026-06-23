import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ActiveJob {
  jobId: string;
  meta: { total?: number; tipo: string; [key: string]: unknown };
}

interface Consulta {
  id: number;
  timestamp: string;
  meta: Record<string, unknown>;
  resultados: unknown[];
}

interface ConsultaState {
  activeJob: ActiveJob | null;
  consultas: Consulta[];
}

const initialState: ConsultaState = {
  activeJob: null,
  consultas: [],
};

const consultaSlice = createSlice({
  name: 'consulta',
  initialState,
  reducers: {
    setActiveJob(state, action: PayloadAction<ActiveJob | null>) {
      state.activeJob = action.payload;
    },
    addConsulta(state, action: PayloadAction<Consulta>) {
      state.consultas = [action.payload, ...state.consultas];
    },
    removeConsulta(state, action: PayloadAction<number>) {
      state.consultas = state.consultas.filter((c) => c.id !== action.payload);
    },
    setConsultas(state, action: PayloadAction<Consulta[]>) {
      state.consultas = action.payload;
    },
  },
});

export const { setActiveJob, addConsulta, removeConsulta, setConsultas } = consultaSlice.actions;
export default consultaSlice.reducer;
