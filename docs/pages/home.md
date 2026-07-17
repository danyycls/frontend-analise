# Home (`/`)

**Componente:** `HomePage` (`src/pages/HomePage/HomePage.tsx`)

Dashboard principal da aplicação. Exibe cards de acesso a todas as ferramentas, uma seção explicativa sobre o funcionamento da plataforma e FAQ.

## Funcionalidades

- Cards de atalho para cada página da aplicação
- Seção "Como funciona" explicando o pipeline de dados
- FAQ com perguntas frequentes
- Badge informativo sobre o número de resultados de ligação política disponíveis (lê do Redux: `lpResultados` e `ligPoliticaCache`)

## Dados

- **Redux:** `navigation.abaAtiva`, `ligacaoPolitica.lpResultados`, `ligacaoPolitica.ligPoliticaCache`
- **Fontes:** Agrega informações de todas as fontes disponíveis na plataforma
