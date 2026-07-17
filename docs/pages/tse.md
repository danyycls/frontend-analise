# TSE (`/tse`)

**Componente:** `TsePage` (`src/pages/TsePage/TsePage.tsx`)

Acesso a dados eleitorais do **TSE** (Tribunal Superior Eleitoral). Subdivide-se em métodos de consulta com abas e sub-abas.

## Funcionalidades

- **Empresas:** Consulta despesas e receitas eleitorais por CNPJ de empresa
- **Políticos por Cargo:** Busca candidatos por cargo, UF e situação (eleitos/não eleitos)
- **Políticos por Partido:** Busca candidatos por partido, com filtro por UF
- **Relação de Doadores:** Consulta doações de campanha por CPF/CNPJ do doador
- **Relação de Fornecedores:** Consulta despesas de campanha por CPF/CNPJ do fornecedor

## Dados

- **API:** `api` (hub ODT) — endpoints `/busca/cargos`, `/busca/partidos`, `/busca/doadores`, `/busca/fornecedores`, `/busca/relacoes`
- **Redux:** `tseSlice` (topAba, metodoState com abas/sub-abas)

## Particularidades

- Sistema de abas e sub-abas com suporte a salvamento de resultados
- Cache local via `rpDataCache` (estado React, não Redux) para preservar resultados entre navegações
- Persistência de estado das abas no Redux (redux-persist)
