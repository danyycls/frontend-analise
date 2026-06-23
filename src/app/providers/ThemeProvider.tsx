import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state) => state.theme.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('podp-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
