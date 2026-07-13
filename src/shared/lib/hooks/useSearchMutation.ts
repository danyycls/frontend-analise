import { useMutation, useQueryClient, type DefaultError, type MutationMeta } from '@tanstack/react-query';

export interface SearchMutationMeta extends MutationMeta {
  getSearchLabel: (params: unknown) => string;
  searchRoute: string;
  searchId?: string | ((params: unknown) => string);
}

interface UseSearchMutationOptions<TParams, TData> {
  mutationKey: string[];
  mutationFn: (params: TParams) => Promise<TData>;
  searchLabel: string | ((params: TParams) => string);
  searchRoute: string;
  searchId?: string | ((params: TParams) => string);
  onSuccess?: (data: TData, params: TParams) => void;
  onError?: (error: DefaultError, params: TParams) => void;
}

export function useSearchMutation<TParams = void, TData = unknown>(
  options: UseSearchMutationOptions<TParams, TData>
) {
  const queryClient = useQueryClient();
  const key = ['search', ...options.mutationKey];

  return useMutation({
    mutationKey: key,
    mutationFn: options.mutationFn,
    meta: {
      getSearchLabel: (params: unknown) => {
        if (typeof options.searchLabel === 'function') {
          return options.searchLabel(params as TParams);
        }
        return options.searchLabel;
      },
      searchRoute: options.searchRoute,
      searchId: options.searchId,
    },
    onSuccess: (data, params) => {
      queryClient.setQueryData(['searchResult', ...key], data);
      options.onSuccess?.(data, params);
    },
    onError: (error, params) => {
      options.onError?.(error, params);
    },
  });
}
