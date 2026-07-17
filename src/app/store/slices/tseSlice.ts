import { createMetodoSlice } from '@/shared/lib/store/createMetodoSlice';

const RP_METODOS = ['empresas', 'cargo', 'partido', 'doador', 'fornecedor'] as const;

const tseSlice = createMetodoSlice('tse', RP_METODOS, 'rp');

export const {
  setTopAba,
  setMetodoAtiva,
  addSubTab,
  removeSubTab,
  reorderSubTabs,
  setMetodoState,
} = tseSlice.actions;
export default tseSlice.reducer;
