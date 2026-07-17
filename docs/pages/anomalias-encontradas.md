# Anomalias Encontradas (`/anomalias-encontradas`)

**Componente:** `AnomaliasEncontradasPage` (`src/pages/AnomaliasEncontradasPage/AnomaliasEncontradasPage.tsx`)

Listagem e visualização de **anomalias detectadas** nas análises de ligação política.

## Funcionalidades

- Cards de anomalias com detalhes do documento e vínculos encontrados
- **Filtros por categoria/tag:**
  - Fornecedor-TSE
  - Doador-TSE
  - Candidato-TSE
  - Contas Irregulares-TCU
  - Inabilitado-TCU
  - Inidôneo-TCU
  - Servidor Público-Portal Transparência
  - Pessoa Exposta-Portal Transparência
- **Filtros por severidade:** Baixa, Média, Alta
- Modal de detalhes com informações completas do documento e vínculos
- Badges coloridas por tipo de vínculo

## Dados

- **API:** `apiP2` (motor SYS) — endpoint de anomalias / P2
- **API:** `api` (hub ODT) — endpoints de entidade para enriquecimento
- **Redux:** `anomaliaSlice`

## Particularidades

- 8 tags de anomalia mapeadas a 3 categorias de severidade
- Cores consistentes via `tagColors.ts`
- Modal reutilizável `AnomaliaDetailModal` com exibição genérica de campos
