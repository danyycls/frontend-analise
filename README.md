# SYS — Front-end de Visualização e Análise de Dados Públicos

Interface web do projeto **SYS**, plataforma para visualização e análise de dados públicos brasileiros. Consome dois backends:

- **Hub de dados ODP**: Agrega dados de fontes externas (IBGE, TSE, Câmara, Senado, Portal da Transparência, TCU, PNCP, SICONFI, OpenCNPJ)
- **Motor de análise SYS**: Realiza análises de ligação política, detecção de anomalias, dados de estados/municípios e feedback

## Stack

- **React 18** com Vite
- React Router DOM
- Redux Toolkit + Redux Persist
- TanStack React Query
- Mapas interativos (react-simple-maps + dados IBGE)
- Tema claro/escuro

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
| `VITE_API_BASE_URL` | URL do hub de dados ODP | `http://localhost:8080` |
| `VITE_WS_BASE_URL` | URL do WebSocket do hub ODP | `ws://localhost:8080` |
| `VITE_P2_API_BASE_URL` | URL do motor de análise SYS | `http://localhost:8084` |
| `VITE_P2_WS_BASE_URL` | URL do WebSocket do motor SYS | `ws://localhost:8084` |

## Backends

| Projeto | Papel | Porta |
|---------|-------|-------|
| Hub de dados ODP | Agrega dados públicos (IBGE, TSE, Câmara, Senado, PortalTransparência, TCU, PNCP, SICONFI, OpenCNPJ) | `8080` |
| Motor de análise SYS | Análise de ligação política, detecção de anomalias, dados de estados/municípios, feedback | `8084` |

### Mapeamento de endpoints

| Endpoint | Backend | Serviço |
|----------|---------|---------|
| `/orgao/analise`, `/uf-municipio/analise` | ODP | Análise de órgãos/PNCP |
| `/ibge/*`, `/deputados/*`, `/senado/*` | ODP | Dados públicos |
| `/tcu/*`, `/portal-transparencia/*` | ODP | TCU e PortalTransparência |
| `/busca/cargos`, `/busca/partidos`, etc. | ODP | TSE |
| `/busca/relacoes`, `/entidade` | ODP | Consultas de entidades |
| `/siconfi/*`, `/opencnpj/*`, `/pncp/*` | ODP | SICONFI, OpenCNPJ, PNCP |
| `/worker/anomalia/*` | SYS | Worker de anomalias |
| `/anomalias` | SYS | Consulta de anomalias |
| `/feedback` | SYS | Feedback |
| `/estado/:uf/*`, `/municipio/*` | SYS | Esferas brasileiras |
| WebSocket `/ws` (canal `anomalia_analise`) | SYS | Progresso de anomalias |

## Estrutura de pastas

```
src/
├── app/             # Store Redux, providers
├── entities/        # Entidades (deputado, senador, licitação, etc.)
├── features/        # Funcionalidades por domínio
│   ├── analise/     # Análise de deputados/senadores/TCU
│   ├── estado/      # Dados de estados e municípios
│   ├── licitacao/   # Consulta de licitações e progresso
│   ├── ligacao-politica/  # Ligação política
│   ├── portal-transparencia/  # Portal da Transparência
│   └── tse/         # Dados do TSE
├── pages/           # Páginas da aplicação
├── shared/          # Código compartilhado
│   ├── api/         # Clientes HTTP (api: ODP, apiP2: SYS)
│   ├── config/      # Variáveis de ambiente
│   ├── lib/         # Utilitários e serviços (WebSocket)
│   └── ui/          # Componentes reutilizáveis
└── widgets/         # Widgets de layout (Sidebar, etc.)
```

## Páginas

Documentação detalhada de cada página em [`docs/pages/`](docs/pages/).

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Home | Dashboard principal com cards das ferramentas |
| `/licitacoes` | Licitações | Busca de contratos públicos no PNCP |
| `/tse` | TSE | Dados eleitorais do TSE |
| `/portal` | Portal Transparência | Dados do Portal da Transparência |
| `/deputados` | Deputados | Análise de deputados federais |
| `/senadores` | Senadores | Análise de senadores |
| `/tcu` | TCU | Consultas ao TCU |
| `/ligacao-politica` | Ligação Política | Cruzamento de fornecedores e políticos |
| `/estado` | Estado (mapa) | Mapa interativo do Brasil |
| `/estado/:uf` | Estado (detalhe) | Dados detalhados de um estado |
| `/anomalias-analise` | Análise de Anomalias | Detecção automatizada de anomalias |
| `/anomalias-encontradas` | Anomalias Encontradas | Listagem de anomalias detectadas |
| `/wiki` | Wiki | Documentação das fontes de dados |
