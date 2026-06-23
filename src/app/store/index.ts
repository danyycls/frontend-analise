import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import navigationReducer from './slices/navigationSlice';
import tseReducer from './slices/tseSlice';
import portalReducer from './slices/portalSlice';
import consultaReducer from './slices/consultaSlice';
import ligacaoPoliticaReducer from './slices/ligacaoPoliticaSlice';
import investigationReducer from './slices/investigationSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    navigation: navigationReducer,
    tse: tseReducer,
    portal: portalReducer,
    consulta: consultaReducer,
    ligacaoPolitica: ligacaoPoliticaReducer,
    investigation: investigationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
