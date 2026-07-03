import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import themeReducer from './slices/themeSlice';
import navigationReducer from './slices/navigationSlice';
import tseReducer from './slices/tseSlice';
import portalReducer from './slices/portalSlice';
import consultaReducer from './slices/consultaSlice';
import ligacaoPoliticaReducer from './slices/ligacaoPoliticaSlice';
import investigationReducer from './slices/investigationSlice';
import recursosMunicipioReducer from './slices/recursosMunicipioSlice';
import anomaliaReducer from './slices/anomaliaSlice';

const persistConfig = {
  key: 'podp-root',
  storage,
  whitelist: ['anomalia', 'investigation', 'consulta', 'recursosMunicipio', 'ligacaoPolitica', 'theme'],
};

const rootReducer = combineReducers({
  theme: themeReducer,
  navigation: navigationReducer,
  tse: tseReducer,
  portal: portalReducer,
  consulta: consultaReducer,
  ligacaoPolitica: ligacaoPoliticaReducer,
  investigation: investigationReducer,
  recursosMunicipio: recursosMunicipioReducer,
  anomalia: anomaliaReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
