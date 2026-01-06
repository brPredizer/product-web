type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const isNode = typeof window === 'undefined';

const memoryStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    }
  };
};

const storage: StorageLike = isNode ? memoryStorage() : window.localStorage;

const toSnakeCase = (str: string): string => str.replace(/([A-Z])/g, '_$1').toLowerCase();

type GetAppParamOptions = { defaultValue?: string; removeFromUrl?: boolean };

const getAppParamValue = (
  paramName: string,
  { defaultValue = undefined, removeFromUrl = false }: GetAppParamOptions = {}
): string | null => {
  if (isNode) {
    return defaultValue ?? null;
  }
  const storageKey = `predictx_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  return null;
};

const getAppParams = () => {
  if (getAppParamValue('clear_access_token') === 'true') {
    storage.removeItem('predictx_access_token');
    storage.removeItem('token');
  }
  const fromUrlDefault = isNode ? undefined : window.location.href;
  return {
    appId: getAppParamValue('app_id', { defaultValue: process.env.NEXT_PUBLIC_APP_ID }),
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getAppParamValue('from_url', { defaultValue: fromUrlDefault }),
    functionsVersion: getAppParamValue('functions_version', { defaultValue: process.env.NEXT_PUBLIC_FUNCTIONS_VERSION })
  };
};

export const appParams = {
  ...getAppParams()
};
