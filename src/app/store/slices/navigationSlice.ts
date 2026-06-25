import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const NAV_TABS = [
  { id: 'home',           label: 'Início',                 icon: '▣' },
  { id: 'conheca-estado', label: 'Conheça seu Estado',     icon: '■' },
  { id: 'licitacoes',     label: 'Licitações',             icon: '▣' },
  { id: 'relacoes',       label: 'TSE',                    icon: '▣' },
  { id: 'portal',         label: 'Portal Transparência',   icon: '▣' },
  { id: 'deputados',      label: 'Análise de Deputados',   icon: '▣' },
  { id: 'senadores',      label: 'Análise de Senadores',   icon: '▣' },
  { id: 'tcu',            label: 'Análises TCU',           icon: '▣' },
  { id: 'wiki-pesquisa',  label: 'Entenda a Ferramenta',   icon: '▣' },
] as const;

export type TabId = (typeof NAV_TABS)[number]['id'] | 'ligacao-politica' | 'feedback';

interface NavigationState {
  abaAtiva: TabId;
  formAberto: boolean;
  tipoBusca: 'orgao' | 'publicacao';
}

const initialState: NavigationState = {
  abaAtiva: 'home',
  formAberto: true,
  tipoBusca: 'orgao',
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setAbaAtiva(state, action: PayloadAction<TabId>) {
      state.abaAtiva = action.payload;
    },
    setFormAberto(state, action: PayloadAction<boolean>) {
      state.formAberto = action.payload;
    },
    setTipoBusca(state, action: PayloadAction<'orgao' | 'publicacao'>) {
      state.tipoBusca = action.payload;
    },
  },
});

export const { setAbaAtiva, setFormAberto, setTipoBusca } = navigationSlice.actions;
export default navigationSlice.reducer;
