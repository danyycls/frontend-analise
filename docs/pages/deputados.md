# Deputados (`/deputados`)

**Componente:** `DeputadosPage` (`src/pages/DeputadosPage/DeputadosPage.tsx`)

Painel completo de análise de **deputados federais**. Consome a API da Câmara dos Deputados via hub ODT.

## Funcionalidades

- Lista de todos os deputados com foto, nome, partido e UF
- Detalhes individuais: mandatos, comissões, despesas parlamentares, frentes parlamentares, histórico político
- Busca avançada por partido (proposições, eventos, votações)
- Navegação por abas: perfil, despesas, comissões, frentes, mandatos externos
- Contador de despesas por mês/ano

## Dados

- **API:** `api` (hub ODT) — endpoints `/deputados`, `/deputados/despesas`, `/deputados/orgaos`
- **Redux:** `deputadosSlice`
- **TanStack Query:** `useQuery` para listagem e detalhes

## Particularidades

- Página com loading por skeletons (esqueleto de carregamento)
- Cache via TanStack Query com stale time configurado
