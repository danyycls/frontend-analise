# Estado (`/estado` e `/estado/:uf`)

## Mapa (`/estado`)

**Componente:** `EstadoPage` (`src/pages/EstadoPage/EstadoPage.tsx`)

Mapa interativo do Brasil. Cada estado é clicável e redireciona para `/estado/:uf`.

- Mapa SVG com cores e tooltips
- Dados carregados via TopoJSON do IBGE
- Navegação para detalhe de cada UF

## Detalhe da UF (`/estado/:uf`)

**Componente:** `ConhecendoEstado` (`src/features/estado/ui/ConhecendoEstado.tsx`)

Deep-dive completo de um estado e seus municípios.

### Funcionalidades

- **Visão Geral:** Nome, UF, população, contadores de políticos
- **Candidatos:** Tabela de prefeitos, vices, vereadores por situação/ano com busca
- **Deputados e Senadores:** Grid com cards, busca por nome, modal de detalhes
- **Finanças (SICONFI):** Dados financeiros consolidados por ano (receitas, despesas, transferências)
- **Licitações (PNCP):** Busca de contratos por UF com seleção de trimestres, gráficos por categoria e valor
- **Municípios:** Lista de municípios com navegação para detalhe individual
- **Recursos Federais:** Transferências federais por município com gráficos

### Sub-páginas

- `/estado/:uf/municipio/:codigo` — `DetalheMunicipio`: licitações do município
- `/estado/:uf/recursos/:codigo` — `RecursosMunicipioDetalhe`: recursos federais por município

### Dados

- **API:** `apiP2` (motor SYS) — `/estado/:uf/dados-completos`
- **API:** `api` (hub ODT) — `/pncp/contratos/uf/:uf`, `/pncp/contratos/municipio/:id`
- **API:** `api` (hub ODT) — `/portal-transparencia/despesas/recursos-recebidos`
- **Fontes:** TSE, Câmara, Senado, SICONFI, PNCP, Portal Transparência, IBGE

## Particularidades

- Página em duas partes: mapa + detalhe (rotas separadas)
- `DetalheMunicipio` e `RecursosMunicipioDetalhe` são renderizados como modais dentro de `ConhecendoEstado`
- Gráficos de pizza (PieChart) para distribuição de valores
- Paginação nas tabelas de candidatos e licitações
- Cache local de licitações com seleção de chaves (ano-trimestre)
