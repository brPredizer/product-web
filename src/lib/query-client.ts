import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
};

export const queryClientInstance = new QueryClient(queryClientConfig);
