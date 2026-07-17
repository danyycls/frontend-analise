# Licitações (`/licitacoes`)

**Componente:** `LicitacoesPage` (`src/pages/LicitacoesPage/LicitacoesPage.tsx`)

Busca e consulta de contratos públicos no **PNCP** (Portal Nacional de Contratações Públicas). Suporta consulta por órgão (CNPJ), UF ou município, com progresso em tempo real via WebSocket.

## Funcionalidades

- **Formulário de consulta:** Seleção de tipo (órgão/UF/município), ano e trimestres
- **Fila de consultas:** Sistema de fila com pausa/retomada, progresso por trimestre
- **Resultados:** Lista de órgãos com contratos encontrados, gráficos de pizza por categoria
- **Detalhes do contrato:** Modal com informações detalhadas (valor, objeto, modalidade, etc.)
- **Integração com Ligação Política:** Botão para enviar consulta para análise de vínculos
- **Seletor de convênios:** Filtro lateral para incluir convênios na consulta
- **Cards informativos:** O que é uma licitação, importância, dispensa de licitação

## Dados

- **API:** `api` (hub ODT) — endpoint `/uf-municipio/analise` e `/orgao/analise`
- **WebSocket:** Canal `uf_municipio_analise` e `orgao_analise` para receber resultados
- **Redux:** `consultaSlice` (consultas, fila, progresso), `navigation` (formAberto)
- **Cache Local:** Resultados persistidos no Redux (redux-persist)

## Fluxo

1. Usuário preenche formulário e adiciona à fila
2. Item é processado: chamada POST para iniciar job + WebSocket aguarda resultados
3. Para consultas por UF/município, resultados são enriquecidos automaticamente (busca dados de cada CNPJ encontrado)
4. Resultados são exibidos em cards com opção de minimizar/maximizar
