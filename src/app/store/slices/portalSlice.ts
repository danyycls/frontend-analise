import { createMetodoSlice } from '@/shared/lib/store/createMetodoSlice';

const PT_METODOS = ['orgaos', 'pessoas', 'cartoes', 'servidores', 'despesas', 'emendas'] as const;

const portalSlice = createMetodoSlice('portal', PT_METODOS, 'pt');

export const {
  setTopAba,
  setMetodoAtiva,
  addSubTab,
  removeSubTab,
  setMetodoState,
} = portalSlice.actions;
export default portalSlice.reducer;
