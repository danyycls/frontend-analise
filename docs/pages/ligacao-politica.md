# Ligação Política (`/ligacao-politica`)

**Componente:** `LigacaoPoliticaPage` (`src/pages/LigacaoPoliticaPage/LigacaoPoliticaPage.tsx`)

Motor de **cruzamento de dados** entre fornecedores de licitações e agentes políticos. Agrega dados de múltiplas fontes para detectar relações entre contratos públicos e políticos.

## Funcionalidades

- Carrega consultas realizadas na página de Licitações
- Analisa cada documento de licitação contra bases de candidatos, partidos, doadores, fornecedores, TCU, servidores públicos
- Exibe resultados por licitação com matchers (vínculos encontrados)
- Salvamento de análises para referência futura
- Sub-abas por consulta

## Dados

- **API:** `apiP2` (motor SYS) — endpoints de ligação política
- **Fontes:** PNCP, TSE, Portal Transparência, Câmara, Senado, TCU
- **Redux:** `ligacaoPoliticaSlice` (subTabs, ligPoliticaCache, lpResultados, lpDataCache)

## Fluxo

1. Recebe dados de consulta do PNCP (via Redux `consulta.consultas` ou `panelLicitacoes`)
2. Envia para o motor SYS que cruza com múltiplas bases
3. Exibe matriz de resultados com cores por tipo de vínculo
4. Permite salvar análises e navegar entre resultados

## Particularidades

- Cache de resultados por consulta via `lpDataCache`
- Sistema de abas para múltiplas consultas abertas simultaneamente
- Notificações via WebSocket para progresso
