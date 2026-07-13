import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const NAV_TABS = [
  { id: 'home',               label: 'Início',                   icon: '▣' },
  { id: 'conheca-estado',     label: 'Conheça seu Estado',       icon: '■' },
  { id: 'licitacoes',         label: 'Licitações',               icon: '▣' },
  { id: 'relacoes',           label: 'TSE',                      icon: '▣' },
  { id: 'portal',             label: 'Portal Transparência',     icon: '▣' },
  { id: 'deputados',          label: 'Análise de Deputados',     icon: '▣' },
  { id: 'senadores',          label: 'Análise de Senadores',     icon: '▣' },
  { id: 'tcu',                label: 'Análises TCU',             icon: '▣' },
  { id: 'anomalias-analise',  label: 'Anomalias Análise',        icon: '▣' },
  { id: 'anomalias-encontradas', label: 'Anomalias Encontradas', icon: '▣' },
  { id: 'wiki-pesquisa',      label: 'Entenda a Ferramenta',     icon: '▣' },
] as const;

export type TabId = (typeof NAV_TABS)[number]['id'] | 'ligacao-politica';

export interface LicitacaoFormState {
  tipo: 'uf' | 'municipio';
  uf: string;
  codigoMunicipio: string;
  municipioNome: string;
  ano: string;
  trimestres: number[];
  modalidade: string;
  cnpjsSelecionados: string[];
}

interface NavigationState {
  abaAtiva: TabId;
  formAberto: boolean;
  tipoBusca: 'orgao' | 'publicacao';
  licitacaoForm: LicitacaoFormState;
}

const initialState: NavigationState = {
  abaAtiva: 'home',
  formAberto: true,
  tipoBusca: 'orgao',
  licitacaoForm: {
    tipo: 'uf',
    uf: 'DF',
    codigoMunicipio: '',
    municipioNome: '',
    ano: String(new Date().getFullYear()),
    trimestres: [],
    modalidade: '',
    cnpjsSelecionados: [],
  },
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
    setLicitacaoForm(state, action: PayloadAction<Partial<LicitacaoFormState>>) {
      state.licitacaoForm = { ...state.licitacaoForm, ...action.payload };
    },
    resetLicitacaoForm(state) {
      state.licitacaoForm = initialState.licitacaoForm;
    },
  },
});

export const { setAbaAtiva, setFormAberto, setTipoBusca, setLicitacaoForm, resetLicitacaoForm } = navigationSlice.actions;
export default navigationSlice.reducer;
