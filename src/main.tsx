import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReduxProvider, QueryProvider, ThemeProvider, AnomaliaWebSocketProvider } from './app/providers';
import App from './App';
import './index.css';

document.documentElement.setAttribute('data-theme', 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReduxProvider>
      <QueryProvider>
        <ThemeProvider>
          <AnomaliaWebSocketProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AnomaliaWebSocketProvider>
        </ThemeProvider>
      </QueryProvider>
    </ReduxProvider>
  </React.StrictMode>
);
