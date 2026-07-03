// @ts-nocheck
import ToolCard from '@/shared/ui/ToolCard/ToolCard';

const DATA_SOURCES = [
  {
    id: 'tse',
    icon: '▣',
    name: 'TSE',
    fullName: 'Tribunal Superior Eleitoral',
    description: 'Dados eleitorais históricos desde 2006: candidatos, partidos, doadores, fornecedores de campanha, prestação de contas e bens declarados.',
    items: ['Vereadores', 'Prefeitos', 'Vice-prefeitos', 'Doadores de campanha'],
  },
  {
    id: 'ibge',
    icon: '■',
    name: 'IBGE',
    fullName: 'Instituto Brasileiro de Geografia e Estatística',
    description: 'Localidades brasileiras com hierarquia administrativa (microrregião, mesorregião, UF) e estimativas populacionais dos municípios.',
    items: ['População', 'Estados', 'Municípios', 'Hierarquia administrativa'],
  },
  {
    id: 'camara',
    icon: '▣',
    name: 'Câmara dos Deputados',
    fullName: 'Câmara dos Deputados — Dados Abertos',
    description: 'Deputados federais eleitos pela UF na legislatura atual, despesas da cota parlamentar, frentes parlamentares, blocos partidários e votações.',
    items: ['Deputados federais', 'Cota parlamentar', 'Votações', 'Frentes parlamentares'],
  },
  {
    id: 'senado',
    icon: '▣',
    name: 'Senado Federal',
    fullName: 'Senado Federal — Dados Abertos',
    description: 'Senadores eleitos pela UF, comissões, processos legislativos, votações em plenário e comissões, emendas orçamentárias e agenda.',
    items: ['Senadores', 'Comissões', 'Emendas', 'Votações'],
  },
  {
    id: 'pncp',
    icon: '▣',
    name: 'PNCP',
    fullName: 'Portal Nacional de Contratações Públicas',
    description: 'Licitações e contratos públicos do estado por ano, incluindo tipo, categoria, fornecedor, vigência e valores globais.',
    items: ['Contratos públicos', 'Licitações', 'Fornecedores', 'Valores contratados'],
  },
  {
    id: 'siconfi',
    icon: '▣',
    name: 'SICONFI',
    fullName: 'Sistema de Informações Contábeis e Fiscais',
    description: 'Dados contábeis e fiscais do setor público: DCA, RGF (despesa com pessoal), RREO (receitas e gastos por função) e MSC.',
    items: ['Despesa com pessoal', 'Receitas', 'Gastos por função', 'Limite da LRF'],
  },
  {
    id: 'transparencia',
    icon: '▣',
    name: 'Portal da Transparência',
    fullName: 'Portal da Transparência — Transferências a Entes',
    description: 'Recursos federais transferidos a estados e municípios, incluindo unidade gestora, órgão concedente e valores mensais.',
    items: ['Transferências federais', 'Convênios', 'Emendas parlamentares', 'Servidores'],
  },
  {
    id: 'tcu',
    icon: '▣',
    name: 'TCU',
    fullName: 'Tribunal de Contas da União',
    description: 'Sanções e condenações do TCU: contas julgadas irregulares (CADIRREG), implicação eleitoral, inabilitados e licitantes inidôneos.',
    items: ['Contas irregulares', 'Sanções', 'Inidôneos', 'Inabilitados'],
  },
];

export function getDataSources() {
  return DATA_SOURCES;
}

export default function DataSourceCards() {
  return (
    <>
      {DATA_SOURCES.map((source) => (
        <ToolCard key={source.id} icon={source.icon} title={source.name}>
          <p>{source.description}</p>
          <ul>
            {source.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ToolCard>
      ))}
    </>
  );
}
