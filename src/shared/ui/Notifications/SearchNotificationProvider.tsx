import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SearchMutationMeta } from '@/shared/lib/hooks/useSearchMutation';

export interface SearchNotification {
  id: string;
  label: string;
  route: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface SearchNotificationContextValue {
  notifications: SearchNotification[];
  notify: (notification: Omit<SearchNotification, 'id'> & { id?: string }) => void;
  dismiss: (id: string) => void;
}

const SearchNotificationContext = createContext<SearchNotificationContextValue>({
  notifications: [],
  notify: () => {},
  dismiss: () => {},
});

export function useSearchNotification() {
  return useContext(SearchNotificationContext);
}

export function SearchNotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<SearchNotification[]>([]);
  const idCounter = useRef(0);

  const notify = useCallback((n: Omit<SearchNotification, 'id'> & { id?: string }) => {
    const id = n.id || `search-${++idCounter.current}`;
    setNotifications((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...n };
        return next;
      }
      return [...prev, { ...n, id }];
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const mutationCache = queryClient.getMutationCache();
    const unsubscribe = mutationCache.subscribe((event) => {
      if (event.type !== 'updated') return;
      const mutation = event.mutation;
      if (!mutation) return;
      const key = mutation.options.mutationKey;
      if (!key || key[0] !== 'search') return;

      const meta = mutation.options.meta as SearchMutationMeta | undefined;
      if (!meta?.searchRoute || !meta?.getSearchLabel) return;

      const variables = mutation.state.variables;
      const id = typeof meta.searchId === 'function'
        ? meta.searchId(variables)
        : meta.searchId || key.join('-');
      const label = meta.getSearchLabel(variables);
      const state = mutation.state;

      if (state.status === 'pending') {
        notify({ id, label, route: meta.searchRoute, status: 'pending' });
      } else if (state.status === 'success') {
        queryClient.setQueryData(['searchResult', ...key], state.data);
        notify({ id, label, route: meta.searchRoute, status: 'success' });
      } else if (state.status === 'error') {
        notify({
          id,
          label,
          route: meta.searchRoute,
          status: 'error',
          error: (state.error as Error)?.message || 'Erro na busca',
        });
      }
    });

    return unsubscribe;
  }, [queryClient, notify]);

  return (
    <SearchNotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </SearchNotificationContext.Provider>
  );
}
