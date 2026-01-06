const isBrowser = typeof window !== 'undefined';
const STORAGE_KEY = 'predictx_mock_state_v1';

const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

type AnyRecord = Record<string, any>;
type EntityStore = Record<string, AnyRecord[]>;
type LogEntry = { id: string; page: string; user_id: string | null; created_at: string };
type AuthState = { currentUserId: string | null; lastLoginRedirect: string | null };
type AppSettings = { id: string; public_settings: { auth_required: boolean; name: string; marketing_site: string } };
type State = { auth: AuthState; app: AppSettings; logs: LogEntry[]; entities: EntityStore };

const defaultState: State = {
  auth: {
    currentUserId: 'user-1',
    lastLoginRedirect: null
  },
  app: {
    id: 'predictx-local',
    public_settings: {
      auth_required: false,
      name: 'PredictX (Local Preview)',
      marketing_site: 'https://predictx.local'
    }
  },
  logs: [],
  entities: {
    User: [
      {
        id: 'user-1',
        full_name: 'Ana Souza',
        email: 'ana@predictx.com',
        role: 'admin',
        admin_level: 3,
        balance: 15250.75,
        total_deposited: 25000,
        total_withdrawn: 4800,
        total_wagered: 18200,
        win_rate: 62,
        markets_participated: 42,
        status: 'active',
        kyc_status: 'verified',
        user_type: 'Retail',
        pending_withdrawals: 0,
        created_date: '2024-05-12T12:00:00Z'
      },
      {
        id: 'user-2',
        full_name: 'Bruno Lima',
        email: 'bruno@predictx.com',
        role: 'trader',
        balance: 2450.5,
        total_deposited: 7800,
        total_withdrawn: 950,
        total_wagered: 5300,
        win_rate: 54,
        markets_participated: 18,
        status: 'active',
        kyc_status: 'verified',
        user_type: 'Retail',
        pending_withdrawals: 250,
        created_date: '2024-07-22T15:45:00Z'
      },
      {
        id: 'user-3',
        full_name: 'Carla Menezes',
        email: 'carla@predictx.com',
        role: 'user',
        admin_level: 0,
        balance: 1250.25,
        total_deposited: 3200,
        total_withdrawn: 450,
        total_wagered: 2200,
        win_rate: 48,
        markets_participated: 12,
        status: 'active',
        kyc_status: 'verified',
        user_type: 'Retail',
        pending_withdrawals: 150,
        created_date: '2024-11-03T10:00:00Z'
      }
    ],
    Market: [
      {
        id: 'market-1',
        title: 'Selic ficará acima de 10% em 2025?',
        category: 'economy',
        status: 'open',
        yes_price: 0.58,
        no_price: 0.42,
        yes_contracts: 12500,
        no_contracts: 8800,
        volume_total: 125000,
        volume_24h: 12400,
        volume_7d_avg: 9100,
        volatility_24h: 0.18,
        closing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 23).toISOString(),
        resolution_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
        resolution_source: 'Banco Central do Brasil',
        description: 'Traders apostam se a taxa Selic permanecerá em dois dígitos até o fim de 2025.',
        featured: true,
        created_date: '2024-12-01T12:00:00Z'
      },
      {
        id: 'market-2',
        title: 'Quem vencerá a eleição municipal de São Paulo?',
        category: 'politics',
        status: 'open',
        yes_price: 0.47,
        no_price: 0.53,
        yes_contracts: 9800,
        no_contracts: 10120,
        volume_total: 98000,
        volume_24h: 8400,
        volume_7d_avg: 7600,
        volatility_24h: 0.22,
        closing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
        resolution_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(),
        resolution_source: 'TSE / TRE-SP',
        description: 'Mercado acompanha a disputa na maior cidade do Brasil com atualizações diárias.',
        featured: true,
        created_date: '2024-11-15T09:00:00Z'
      },
      {
        id: 'market-3',
        title: 'Bitcoin fechará acima de US$ 100k em 2025?',
        category: 'technology',
        status: 'open',
        yes_price: 0.39,
        no_price: 0.61,
        yes_contracts: 7400,
        no_contracts: 11300,
        volume_total: 86500,
        volume_24h: 5400,
        volume_7d_avg: 6200,
        volatility_24h: 0.27,
        closing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
        resolution_source: 'Coinbase / B3 Crypto Index',
        description: 'Mercado cripto segue em alta e este contrato mede a probabilidade de romper US$ 100k.',
        featured: false,
        created_date: '2024-10-05T16:30:00Z'
      }
    ],
    Position: [
      {
        id: 'position-1',
        user_id: 'user-1',
        market_id: 'market-1',
        market_title: 'Selic ficará acima de 10% em 2025?',
        side: 'yes',
        contracts: 180,
        average_price: 0.55,
        total_invested: 99,
        status: 'open',
        created_date: '2024-12-20T10:00:00Z'
      },
      {
        id: 'position-2',
        user_id: 'user-1',
        market_id: 'market-2',
        market_title: 'Quem vencerá a eleição municipal de São Paulo?',
        side: 'no',
        contracts: 120,
        average_price: 0.48,
        total_invested: 57.6,
        status: 'open',
        created_date: '2024-12-10T13:30:00Z'
      },
      {
        id: 'position-3',
        user_id: 'user-2',
        market_id: 'market-3',
        market_title: 'Bitcoin fechará acima de US$ 100k em 2025?',
        side: 'yes',
        contracts: 60,
        average_price: 0.41,
        total_invested: 24.6,
        status: 'open',
        created_date: '2024-12-18T08:42:00Z'
      }
    ],
    Transaction: [
      {
        id: 'tx-1',
        user_id: 'user-1',
        type: 'deposit',
        amount: 2000,
        fee: 50,
        net_amount: 1950,
        description: 'Depósito via PIX',
        created_date: '2024-12-05T14:20:00Z'
      },
      {
        id: 'tx-2',
        user_id: 'user-1',
        type: 'buy',
        market_id: 'market-1',
        market_title: 'Selic ficará acima de 10% em 2025?',
        amount: 99,
        net_amount: 99,
        side: 'yes',
        contracts: 180,
        price: 0.55,
        description: 'Compra de 180 contratos SIM',
        created_date: '2024-12-20T10:05:00Z'
      },
      {
        id: 'tx-3',
        user_id: 'user-1',
        type: 'withdrawal',
        amount: 500,
        fee: 37.5,
        net_amount: 462.5,
        description: 'Saque aprovado',
        created_date: '2024-12-22T18:00:00Z'
      },
      {
        id: 'tx-4',
        user_id: 'user-2',
        type: 'deposit',
        amount: 1500,
        fee: 37.5,
        net_amount: 1462.5,
        description: 'Depósito via PIX',
        created_date: '2024-12-07T11:12:00Z'
      }
    ],
    WithdrawalRequest: [
      {
        id: 'wd-1',
        user_id: 'user-1',
        user_email: 'ana@predictx.com',
        amount: 800,
        fee: 60,
        net_amount: 740,
        status: 'pending',
        payment_method: 'PIX',
        payment_details: 'ana@predictx.com',
        created_date: '2024-12-26T09:10:00Z'
      }
    ],
    RiskDisclosure: [
      {
        id: 'risk-1',
        user_id: 'user-1',
        document_version: '1.0',
        locale: 'pt-BR',
        valid_until: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150).toISOString(),
        answers_confirmed: true,
        market_id: null,
        revoked: false,
        created_date: '2024-11-01T08:00:00Z'
      }
    ],
    UserRiskLimits: [
      {
        id: 'limit-1',
        user_id: 'user-1',
        max_contract_value: 5000,
        max_position_value: 2000,
        max_daily_volume: 3000,
        created_date: '2024-09-01T10:00:00Z'
      }
    ],
    ContentPost: [
      {
        id: 'post-1',
        title: 'Brasil terá superávit primário em 2025?',
        excerpt: 'Nossa análise sugere probabilidade de 42% para superávit acima de R$ 30 bi.',
        content: 'Dados do Tesouro indicam um cenário de ajuste gradual... ',
        category: 'market_update',
        tags: ['fiscal', 'brasil'],
        status: 'published',
        metadata: { position: 'no', value: 58 },
        author_id: 'user-1',
        author_name: 'Ana Souza',
        created_date: '2024-12-12T12:00:00Z'
      }
    ],
    AdCampaign: [
      {
        id: 'campaign-1',
        name: 'Campanha Copa América',
        advertiser: 'PredictX',
        slot: 'header_banner',
        status: 'active',
        impressions: 185000,
        clicks: 7200,
        spent: 4200,
        budget: 6000,
        start_date: '2024-12-01T00:00:00Z',
        end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
        creative_url: 'https://images.predictx.local/campaigns/copa.png',
        destination_url: 'https://predictx.com.br/copa'
      }
    ]
  }
};

const createHttpError = (message: string, status = 500) => {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
};

const readPersistedState = (): State => {
  if (!isBrowser) return deepClone(defaultState);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(defaultState);
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...deepClone(defaultState),
      ...parsed,
      entities: { ...deepClone(defaultState.entities), ...(parsed.entities || {}) }
    };
  } catch (error) {
    console.warn('Failed to read mock state, using defaults:', error);
    return deepClone(defaultState);
  }
};

let state: State = readPersistedState();

const persistState = (): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist mock state:', error);
  }
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const simulateNetwork = async <T>(fn: () => T): Promise<T> => {
  if (isBrowser) {
    await sleep(40 + Math.random() * 80);
  }
  return fn();
};

const ensureEntityStore = (entityName: string): AnyRecord[] => {
  if (!state.entities[entityName]) {
    state.entities[entityName] = [];
  }
  return state.entities[entityName];
};

const generateId = (entityName: string): string => `${entityName.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const compareValues = (a: any, b: any): number => {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const aDate = Date.parse(a);
  const bDate = Date.parse(b);
  const aIsDate = !Number.isNaN(aDate);
  const bIsDate = !Number.isNaN(bDate);
  if (aIsDate && bIsDate) return aDate - bDate;
  return String(a).localeCompare(String(b));
};

const sortItems = (items: AnyRecord[], sortBy?: string | null): AnyRecord[] => {
  if (!sortBy) return [...items];
  const direction = sortBy.startsWith('-') ? -1 : 1;
  const field = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
  return [...items].sort((a, b) => compareValues(a[field], b[field]) * direction);
};

const matchesCriteria = (item: AnyRecord, criteria: AnyRecord = {}): boolean => {
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined || value === null) return true;
    const current = item[key];
    if (Array.isArray(value)) {
      if (Array.isArray(current)) {
        return value.every((val) => current.includes(val));
      }
      return value.includes(current);
    }
    return current === value;
  });
};

const queryEntities = (entityName: string, criteria?: AnyRecord | null, sortBy?: string | null, limit = 50): AnyRecord[] => {
  const store = ensureEntityStore(entityName);
  let result = criteria ? store.filter((item) => matchesCriteria(item, criteria)) : [...store];
  result = sortItems(result, sortBy);
  if (limit) {
    result = result.slice(0, limit);
  }
  return deepClone(result);
};

const createEntityItem = (entityName: string, data: AnyRecord = {}): AnyRecord => {
  const now = new Date().toISOString();
  const store = ensureEntityStore(entityName);
  const item: AnyRecord = {
    id: data?.id || generateId(entityName),
    created_date: data?.created_date || now,
    updated_date: now,
    ...data,
  };
  store.unshift(item);
  persistState();
  return deepClone(item);
};

const updateEntityItem = (entityName: string, id: string, data: AnyRecord): AnyRecord => {
  const store = ensureEntityStore(entityName);
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`${entityName} ${id} not found`);
  }
  store[index] = {
    ...store[index],
    ...data,
    updated_date: new Date().toISOString()
  };
  persistState();
  return deepClone(store[index]);
};

const deleteEntityItem = (entityName: string, id: string): boolean => {
  const store = ensureEntityStore(entityName);
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) return false;
  store.splice(index, 1);
  persistState();
  return true;
};

type EntityHandlers = {
  list: (sortBy?: string | null, limit?: number) => Promise<AnyRecord[]>;
  filter: (criteria?: AnyRecord | null, sortBy?: string | null, limit?: number) => Promise<AnyRecord[]>;
  create: (data: AnyRecord) => Promise<AnyRecord>;
  update: (id: string, data: AnyRecord) => Promise<AnyRecord>;
  delete: (id: string) => Promise<boolean>;
};

const entitiesProxyCache = new Map<string, EntityHandlers>();

const getEntityHandlers = (entityName: string): EntityHandlers => {
  if (entitiesProxyCache.has(entityName)) {
    return entitiesProxyCache.get(entityName)!;
  }

  const handlers: EntityHandlers = {
    list: (sortBy, limit = 50) => simulateNetwork(() => queryEntities(entityName, null, sortBy, limit)),
    filter: (criteria, sortBy, limit = 50) => simulateNetwork(() => queryEntities(entityName, criteria || undefined, sortBy, limit)),
    create: (data) => simulateNetwork(() => createEntityItem(entityName, data)),
    update: (id, data) => simulateNetwork(() => updateEntityItem(entityName, id, data)),
    delete: (id) => simulateNetwork(() => deleteEntityItem(entityName, id))
  };

  entitiesProxyCache.set(entityName, handlers);
  return handlers;
};

const getCurrentUser = (): AnyRecord | null => {
  if (!state.auth.currentUserId) return null;
  const users = ensureEntityStore('User');
  return users.find((u) => u.id === state.auth.currentUserId) || null;
};

const loginDefaultUser = (): AnyRecord | null => {
  const fallbackId = state.auth.currentUserId || defaultState.auth.currentUserId || ensureEntityStore('User')[0]?.id;
  if (!fallbackId) return null;
  state.auth.currentUserId = fallbackId;
  persistState();
  return deepClone(getCurrentUser());
};

const emitAuthEvent = (): void => {
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('predictx:auth-changed'));
  }
};

const mockLLMResponse = async ({ prompt }: { prompt?: string }): Promise<Record<string, any>> => {
  const lowerPrompt = (prompt || '').toLowerCase();

  if (lowerPrompt.includes('segmenta')) {
    const users = ensureEntityStore('User');
    const segments = {
      high_value: {
        user_ids: users.filter((u) => (u.total_wagered || 0) > 5000).map((u) => u.id),
        count: users.filter((u) => (u.total_wagered || 0) > 5000).length,
        characteristics: 'Usuários com alto volume apostado e saldo disponível relevante.',
        total_value: users.reduce((sum, u) => sum + ((u.balance || 0) > 5000 ? u.balance || 0 : 0), 0),
        recommendations: 'Oferecer limites personalizados e campanhas VIP.',
        insights: 'Preferem mercados macro e políticos com liquidez elevada.'
      },
      new_depositors: {
        user_ids: users.filter((u) => Date.now() - Date.parse(u.created_date) < 1000 * 60 * 60 * 24 * 14).map((u) => u.id),
        count: users.filter((u) => Date.now() - Date.parse(u.created_date) < 1000 * 60 * 60 * 24 * 14).length,
        characteristics: 'Novos usuários que já realizaram depósito inicial.',
        total_value: 4800,
        recommendations: 'Campanhas educativas e bônus progressivos nos primeiros 30 dias.',
        insights: 'Engajamento aumenta quando há missões guiadas.'
      },
      infrequent_players: {
        user_ids: users.filter((u) => (u.markets_participated || 0) < 5).map((u) => u.id),
        count: users.filter((u) => (u.markets_participated || 0) < 5).length,
        characteristics: 'Participação baixa e períodos longos sem apostas.',
        total_value: 1800,
        recommendations: 'Enviar alertas com mercados populares e limites reduzidos.',
        insights: 'Maior sensibilidade a notificações push durante eventos esportivos.'
      },
      at_risk: {
        user_ids: users.filter((u) => (u.pending_withdrawals || 0) > 0).map((u) => u.id),
        count: users.filter((u) => (u.pending_withdrawals || 0) > 0).length,
        characteristics: 'Usuários com intenção recente de saque ou churn.',
        total_value: 250,
        recommendations: 'Contato proativo do suporte e novas missões de retenção.',
        insights: 'Sensíveis a mensagens sobre segurança e transparência.'
      },
      active_traders: {
        user_ids: users.filter((u) => (u.markets_participated || 0) > 15).map((u) => u.id),
        count: users.filter((u) => (u.markets_participated || 0) > 15).length,
        characteristics: 'Alta frequência de ordens e múltiplos mercados simultâneos.',
        total_value: 13600,
        recommendations: 'Liberar ferramentas avançadas e limites dinâmicos.',
        insights: 'Respondem bem a relatórios semanais personalizados.'
      },
      potential_whales: {
        user_ids: users.filter((u) => (u.balance || 0) > 10000).map((u) => u.id),
        count: users.filter((u) => (u.balance || 0) > 10000).length,
        characteristics: 'Saldo elevado aguardando oportunidades.',
        total_value: users.reduce((sum, u) => sum + ((u.balance || 0) > 10000 ? u.balance || 0 : 0), 0),
        recommendations: 'Convites para campanhas exclusivas e mentorias com especialistas.',
        insights: 'Preferem mercados institucionais e eventos macro.'
      }
    };
    return { segments };
  }

  if (lowerPrompt.includes('previs')) {
    const base = {
      predictions: {
        user_growth: {
          next_7_days: 320,
          next_30_days: 1380,
          confidence: 'medium',
          trend: 'up',
          insights: 'Campanhas e mercados macro devem sustentar o crescimento.'
        },
        revenue: {
          next_7_days: 18500,
          next_30_days: 78000,
          confidence: 'medium',
          trend: 'up',
          insights: 'Maior volume em mercados econômicos e políticos.'
        },
        deposits: {
          next_7_days: 95000,
          next_30_days: 388000,
          confidence: 'medium',
          trend: 'up',
          insights: 'Efeito de campanhas de final de ano e onboarding guiado.'
        },
        churn: {
          next_7_days: 62,
          next_30_days: 210,
          confidence: 'low',
          trend: 'stable',
          insights: 'Monitorar usuários sem apostas em 7 dias e reforçar missões.'
        }
      },
      summary: 'Crescimento saudável sustentado por eventos macro e alta liquidez em mercados políticos.',
      risks: [
        'Volatilidade macroeconômica pode reduzir depósitos de varejo.',
        'Dependência de poucos mercados para 60% do volume.'
      ],
      opportunities: [
        'Expansão de mercados esportivos aumenta aquisição orgânica.',
        'Conteúdo educativo reduz churn inicial em até 18%.'
      ],
      recommendations: [
        'Sequenciar campanhas temáticas alinhadas ao calendário noticioso.',
        'Lançar alertas personalizados para usuários inativos há 5 dias.'
      ]
    };
    return base;
  }

  return {
    news_intensity: 0.68,
    directional_consensus: 0.24,
    macro_shock: 0.12,
    external_probability: 0.57,
    confidence: 0.72,
    key_indicators: ['Focus/BCB', 'IPCA-15', 'Curva de DI'],
    sources: ['Banco Central do Brasil', 'Valor Econômico', 'IPEA'],
    summary: 'Fluxo recente de notícias aponta probabilidade ligeiramente maior para o cenário "SIM".'
  };
};

export const mockApi = {
  entities: new Proxy({}, {
    get: (_, entityName: string) => getEntityHandlers(entityName)
  }),
  auth: {
    me: () => simulateNetwork(() => {
      const user = getCurrentUser();
      if (!user) {
        throw createHttpError('Authentication required', 401);
      }
      return deepClone(user);
    }),
    updateMe: (data: AnyRecord) => simulateNetwork(() => {
      const user = getCurrentUser();
      if (!user) {
        throw createHttpError('No user logged in', 401);
      }
      const updated = updateEntityItem('User', user.id, data);
      emitAuthEvent();
      return updated;
    }),
    logout: (redirectUrl?: string | null) => simulateNetwork(() => {
      state.auth.lastLoginRedirect = redirectUrl || null;
      state.auth.currentUserId = null;
      persistState();
      emitAuthEvent();
      return true;
    }),
    redirectToLogin: () => simulateNetwork(() => {
      const user = loginDefaultUser();
      if (!user) {
        throw new Error('No mock users available');
      }
      emitAuthEvent();
      return user;
    })
  },
  appLogs: {
    logUserInApp: (pageName: string) => simulateNetwork(() => {
      state.logs.push({
        id: generateId('log'),
        page: pageName,
        user_id: getCurrentUser()?.id || null,
        created_at: new Date().toISOString()
      });
      if (state.logs.length > 200) {
        state.logs = state.logs.slice(-200);
      }
      persistState();
      return true;
    })
  },
  integrations: {
    Core: {
      InvokeLLM: (payload?: Record<string, any>) => simulateNetwork(() => mockLLMResponse(payload || {}))
    }
  }
};

export const mockPublicSettings: AppSettings = deepClone(defaultState.app);

export const resetMockState = (): void => {
  state = deepClone(defaultState);
  persistState();
};
