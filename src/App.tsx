import { lazy, Suspense } from 'react';
import FeedbackPage from './pages/FeedbackPage/FeedbackPage';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './widgets/Sidebar/Sidebar';
import ConhecendoEstado from './features/estado/ui/ConhecendoEstado';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const LicitacoesPage = lazy(() => import('./pages/LicitacoesPage/LicitacoesPage'));
const TsePage = lazy(() => import('./pages/TsePage/TsePage'));
const PortalTransparenciaPage = lazy(() => import('./pages/PortalTransparenciaPage/PortalTransparenciaPage'));
const DeputadosPage = lazy(() => import('./pages/DeputadosPage/DeputadosPage'));
const SenadoresPage = lazy(() => import('./pages/SenadoresPage/SenadoresPage'));
const TcuPage = lazy(() => import('./pages/TcuPage/TcuPage'));
const LigacaoPoliticaPage = lazy(() => import('./pages/LigacaoPoliticaPage/LigacaoPoliticaPage'));
const EstadoPage = lazy(() => import('./pages/EstadoPage/EstadoPage'));
const WikiPage = lazy(() => import('./pages/WikiPage/WikiPage'));

function PageLoader() {
  return (
    <div className="tab-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <p className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        Carregando...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/estado/:uf" element={<ConhecendoEstado />} />
      <Route path="*" element={<AppLayout />} />
    </Routes>
  );
}

function AppLayout() {
  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <div className="app-main-inner">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route index element={<HomePage />} />
              <Route path="licitacoes" element={<LicitacoesPage />} />
              <Route path="tse" element={<TsePage />} />
              <Route path="portal" element={<PortalTransparenciaPage />} />
              <Route path="deputados" element={<DeputadosPage />} />
              <Route path="senadores" element={<SenadoresPage />} />
              <Route path="tcu" element={<TcuPage />} />
              <Route path="ligacao-politica" element={<LigacaoPoliticaPage />} />
              <Route path="estado" element={<EstadoPage />} />
              <Route path="wiki" element={<WikiPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
