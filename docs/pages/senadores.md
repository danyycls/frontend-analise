# Senadores (`/senadores`)

**Componente:** `SenadoresPage` (`src/pages/SenadoresPage/SenadoresPage.tsx`)

Painel completo de análise de **senadores**. Consome a API do Senado Federal via hub ODT.

## Funcionalidades

- Lista de todos os senadores com foto, nome, partido e UF
- Detalhes individuais: cargos, comissões, mandatos, emendas, processos legislativos
- Pauta do plenário e detalhes de comissões
- Navegação por abas: perfil, cargos, comissões, mandatos, emendas

## Dados

- **API:** `api` (hub ODT) — endpoints `/senadores`
- **Redux:** `senadoresSlice`
- **TanStack Query:** `useQuery` para listagem

## Particularidades

- Loading por estados via React Query
- Dados de subsídios, presenças e votações disponíveis por senador
