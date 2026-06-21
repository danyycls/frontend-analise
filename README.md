# PODP — Projeto Observatório de Dados Públicos (Front-end)

Interface web do **PODP**, plataforma unificada para análise de dados públicos brasileiros. Consolida informações eleitorais (TSE), parlamentares (Câmara, Senado), gastos públicos (Portal da Transparência, TCU), contratações (PNCP) e dados fiscais (SICONFI/IBGE).

## Stack

- **React 18** com Vite
- React Router DOM
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
| `VITE_API_BASE_URL` | URL da API do back-end | `http://localhost:8080` |
| `VITE_WS_BASE_URL` | URL do WebSocket do back-end | `ws://localhost:8080` |

## Back-end

A API REST e WebSocket consumida por este front-end está no repositório:

[https://github.com/danyycls/backend-analise](https://github.com/danyycls/backend-analise)

## Estrutura de pastas

```
src/
├── components/     # Componentes da interface
├── App.jsx         # Componente principal com roteamento e abas
├── config.js       # Configuração de API
├── index.css       # Estilos globais
└── main.jsx        # Entrypoint
```
