# Portal Transparência (`/portal`)

**Componente:** `PortalTransparenciaPage` (`src/pages/PortalTransparenciaPage/PortalTransparenciaPage.tsx`)

Acesso a dados oficiais do **Portal da Transparência** do governo federal. Subdivide-se em métodos de consulta com abas e sub-abas.

## Funcionalidades

- **Órgãos:** Consulta órgãos públicos federais por código ou nome (SIAPE/SIAFI)
- **Pessoas:** Busca pessoas físicas ou jurídicas com vínculos na administração pública
- **Cartões:** Gastos com cartões de pagamento do governo federal
- **Servidores:** Servidores públicos federais ativos e inativos (cargo, lotação, remuneração)
- **Despesas:** Despesas governamentais por órgão, ano, UF ou favorecido
- **Emendas:** Emendas parlamentares ao orçamento federal

## Dados

- **API:** `api` (hub ODT) — endpoints `/portal/orgaos`, `/portal/pessoas`, `/portal/cartoes`, `/portal/servidores`, `/portal/despesas`, `/portal/emendas`
- **Redux:** `portalSlice` (topAba, metodoState)

## Particularidades

- Cache local via `ptDataCache` (estado React)
- Mesmo padrão de abas/sub-abas do TSE, compartilhando o mesmo tipo de slice gerado pela factory `createMetodoSlice`
