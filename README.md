# PODP — Projeto Observatório de Dados Públicos (Front-end)

Interface web do **PODP**, plataforma unificada para análise de dados públicos brasileiros. Consome dois backends:

- **P1** (`backend-analise`): Data hub com fontes externas (IBGE, TSE, Câmara, Senado, PortalTransparência, TCU, PNCP, SICONFI, OpenCNPJ)
- **P2** (`projeto2-analise`): Motor de análise (ligação política, anomalias, esferas brasileiras, feedback)

## Stack

- **React 18** com Vite
- React Router DOM
- Redux Toolkit + Redux Persist
- TanStack React Query
- Sigma.js / Graphology (visualização de grafos)
- Mapas interativos (react-simple-maps + dados IBGE)
- Tema claro/escuro (Tailwind CSS)

## Como rodar

```bash
npm install
npm run dev
```

A aplicação será servida em `http://localhost:8081`.

## Build

```bash
npm run build
```

Os arquivos estáticos serão gerados em `dist/`.

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_BASE_URL` | URL do P1 (data hub) | `http://localhost:8080` |
| `VITE_WS_BASE_URL` | URL do WebSocket do P1 | `ws://localhost:8080` |
| `VITE_P2_API_BASE_URL` | URL do P2 (motor de análise) | `http://localhost:8084` |
| `VITE_P2_WS_BASE_URL` | URL do WebSocket do P2 | `ws://localhost:8084` |

## Backends

O front-end consome duas APIs:

| Projeto | Repositório | Papel | Porta |
|---------|-------------|-------|-------|
| P1 | [github.com/danyele/podp](https://github.com/danyele/podp) | Data hub: fontes externas, dados TSE | `8080` |
| P2 | [github.com/danyele/podp-analise](https://github.com/danyele/podp-analise) | Motor de análise: ligação política, anomalias | `8084` |

### Mapeamento de rotas

| Rota | Backend | Serviço |
|------|---------|---------|
| `/orgao/analise`, `/uf-municipio/analise` | P1 | Análise de órgãos/PNCP |
| `/ibge/*`, `/deputados/*`, `/senado/*` | P1 | Dados públicos |
| `/tcu/*`, `/portal-transparencia/*` | P1 | TCU e PortalTransparência |
| `/busca/cargos`, `/busca/partidos`, etc. | P1 | TSE (CSV importado) |
| `/busca/relacoes`, `/entidade` | P1 | Consultas de entidades |
| `/siconfi/*`, `/opencnpj/*`, `/pncp/*` | P1 | SICONFI, OpenCNPJ, PNCP |
| `/busca/contexto` | P2 | Ligação política |
| `/worker/anomalia/*` | P2 | Worker de anomalias |
| `/anomalias` | P2 | Consulta de anomalias |
| `/feedback` | P2 | Feedback |
| `/estado/:uf/*`, `/municipio/*` | P2 | Esferas brasileiras |
| WebSocket `/ws` (canal `anomalia_analise`) | P2 | Progresso de anomalias |

## Estrutura de pastas

```
src/
├── app/             # Store Redux, providers
├── domain/          # Modelos de domínio (grafos, cross-reference)
├── entities/        # Entidades (deputado, senador, licitação, etc.)
├── features/        # Funcionalidades por domínio
│   ├── analise/     # Análise de deputados/senadores/TCU
│   ├── estado/      # Dados de estados e municípios
│   ├── investigative-panel/  # Painel investigativo com grafos
│   ├── licitacao/   # Consulta de licitações e progresso
│   ├── ligacao-politica/  # Ligação política (chama P2)
│   ├── portal-transparencia/  # Portal da Transparência
│   └── tse/         # Dados do TSE
├── pages/           # Páginas da aplicação
├── shared/          # Código compartilhado
│   ├── api/         # Clientes HTTP (api: P1, apiP2: P2)
│   ├── config/      # Variáveis de ambiente
│   ├── lib/         # Utilitários e serviços (WebSocket)
│   └── ui/          # Componentes reutilizáveis
└── widgets/         # Widgets de layout (Sidebar, etc.)
```
