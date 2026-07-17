# TCU (`/tcu`)

**Componente:** `TcuPage` (`src/pages/TcuPage/TcuPage.tsx`)

Consulta a registros oficiais do **TCU** (Tribunal de Contas da União). Subdivide-se em quatro categorias com abas e sub-abas.

## Funcionalidades

- **Contas Irregulares:** Prestadores de contas com contas julgadas irregulares
- **Fins Eleitorais:** Decisões do TCU com implicações eleitorais
- **Inabilitados:** Pessoas inabilitadas para exercício de cargo em comissão
- **Inidôneos:** Empresas e pessoas físicas declaradas inidôneas para licitar

## Dados

- **API:** `api` (hub ODT) — endpoints `/tcu/contas-irregulares`, `/tcu/fins-eleitorais`, `/tcu/inabilitados`, `/tcu/inidoneos`
- **Redux:** `tcuSubSlice` (topAba, metodoState — mesmo padrão factory)

## Particularidades

- Paginação inline em cada sub-aba
- Mesmo padrão de abas do TSE/Portal, usando a factory `createMetodoSlice`
