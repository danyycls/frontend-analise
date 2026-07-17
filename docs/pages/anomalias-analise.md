# Análise de Anomalias (`/anomalias-analise`)

**Componente:** `AnomaliasAnalisePage` (`src/pages/AnomaliasAnalisePage/AnomaliasAnalisePage.tsx`)

Ferramenta de **detecção automatizada de anomalias** em licitações. Busca contratos no PNCP e analisa vínculos políticos automaticamente.

## Funcionalidades

- **Formulário de consulta:** Mesmo formulário da página de Licitações (órgão, UF, município)
- **Pipeline de análise:**
  1. Busca licitações no PNCP
  2. Enriquece dados por órgão
  3. Analisa vínculos políticos via motor SYS
- **Progresso em etapas:** Indicador visual com 4 estágios (buscando, enriquecendo, analisando, concluído)
- **Fila de análises:** Sistema de fila com pausa/retomada
- **Histórico:** Lista de análises anteriores com opção de visualizar anomalias encontradas

## Dados

- **API:** `api` (hub ODT) — endpoints de busca PNCP
- **API:** `apiP2` (motor SYS) — `/worker/anomalia/iniciar`, `/worker/anomalia/progression`
- **WebSocket:** Canal `anomalia_analise` para progresso
- **Redux:** `anomaliaSlice` (analises, active, fila)

## Fluxo

1. Usuário adiciona itens à fila (órgão, UF ou município + ano)
2. Para cada item: busca contratos → enriquece → envia para análise de anomalias
3. Motor SYS processa e retorna progresso via WebSocket com polling fallback
4. Resultados ficam disponíveis na página de Anomalias Encontradas

## Particularidades

- Polling a cada 3s como fallback caso WebSocket não receba evento de conclusão
- Cancelamento de análise via `cancelRef` e endpoint `/worker/anomalia/parar`
