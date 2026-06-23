import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { toggleTheme } from '@/app/store/slices/themeSlice';
import { setAbaAtiva, NAV_TABS, type TabId } from '@/app/store/slices/navigationSlice';
import { setSubTabAtiva } from '@/app/store/slices/ligacaoPoliticaSlice';

const TAB_ROUTES: Record<string, string> = {
  'home': '/',
  'investigar': '/investigar',
  'conheca-estado': '/estado',
  'licitacoes': '/licitacoes',
  'relacoes': '/tse',
  'portal': '/portal',
  'deputados': '/deputados',
  'senadores': '/senadores',
  'tcu': '/tcu',
  'wiki-pesquisa': '/wiki',
  'ligacao-politica': '/ligacao-politica',
};

function useActiveTab(): TabId {
  const path = useLocation().pathname;
  if (path === '/' || path === '') return 'home';
  for (const [tabId, route] of Object.entries(TAB_ROUTES)) {
    if (route === path) return tabId as TabId;
  }
  return 'home';
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const abaAtiva = useActiveTab();
  const theme = useAppSelector((s) => s.theme.theme);
  const lpResultados = useAppSelector((s) => s.ligacaoPolitica.lpResultados);
  const ligPoliticaCache = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaCache);
  const discoveryCount = useAppSelector((s) => s.investigation.discoveries.length);

  const showLpNavBtn = lpResultados && ligPoliticaCache.length > 0;

  const handleTabClick = (tabId: TabId) => {
    dispatch(setAbaAtiva(tabId));
    navigate(TAB_ROUTES[tabId] || '/');
  };

  const handleLpClick = () => {
    dispatch(setSubTabAtiva('geral'));
    dispatch(setAbaAtiva('ligacao-politica'));
    navigate(TAB_ROUTES['ligacao-politica']);
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand" onClick={() => { navigate('/'); dispatch(setAbaAtiva('home')); }}>
        <span className="sidebar-logo">◆</span>
        <span className="sidebar-title">PODP</span>
        <span className="sidebar-badge">// SYS.v1</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${abaAtiva === tab.id ? 'ativo' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            <span className="nav-tab-label">{tab.label}</span>
            {tab.id === 'investigar' && discoveryCount > 0 && (
              <span className="nav-tab-badge">{discoveryCount}</span>
            )}
          </button>
        ))}
        {showLpNavBtn && (
          <button
            className={`nav-tab ${abaAtiva === 'ligacao-politica' ? 'ativo' : ''}`}
            onClick={handleLpClick}
          >
            <span className="nav-tab-icon">▣</span>
            <span className="nav-tab-label">Ligações Políticas</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          className="theme-toggle"
          onClick={() => dispatch(toggleTheme())}
          title="Alternar tema"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </aside>
  );
}
