import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { toggleTheme } from '@/app/store/slices/themeSlice';
import { setAbaAtiva, NAV_TABS, type TabId } from '@/app/store/slices/navigationSlice';

const TAB_ROUTES: Record<string, string> = {
  'home': '/',
  'conheca-estado': '/estado',
  'licitacoes': '/licitacoes',
  'relacoes': '/tse',
  'portal': '/portal',
  'deputados': '/deputados',
  'senadores': '/senadores',
  'tcu': '/tcu',
  'anomalias-analise': '/anomalias-analise',
  'anomalias-encontradas': '/anomalias-encontradas',
  'wiki-pesquisa': '/wiki',
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

  const handleTabClick = (tabId: TabId) => {
    dispatch(setAbaAtiva(tabId));
    navigate(TAB_ROUTES[tabId] || '/');
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand" onClick={() => { navigate('/'); dispatch(setAbaAtiva('home')); }}>
        <span className="sidebar-logo">◈</span>
        <span className="sidebar-title">OBSERVATÓRIO</span>
        <span className="sidebar-badge">// DADOS PÚBLICOS</span>
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
          </button>
        ))}
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
