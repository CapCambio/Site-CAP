import { apiRequest } from './queryClient';

// Funções padronizadas para chamadas HTTP
export const http = {
  // GET requests
  get: async <T = any>(url: string): Promise<T> => {
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // POST requests
  post: async <T = any>(url: string, data?: unknown): Promise<T> => {
    const response = await apiRequest('POST', url, data);
    return response.json();
  },

  // PUT requests
  put: async <T = any>(url: string, data?: unknown): Promise<T> => {
    const response = await apiRequest('PUT', url, data);
    return response.json();
  },

  // DELETE requests
  delete: async <T = any>(url: string): Promise<T> => {
    const response = await apiRequest('DELETE', url);
    return response.json();
  },

  // PATCH requests
  patch: async <T = any>(url: string, data?: unknown): Promise<T> => {
    const response = await apiRequest('PATCH', url, data);
    return response.json();
  }
};

// Funções específicas para endpoints da API
export const api = {
  // Currencies
  currencies: {
    getAll: () => http.get<Currency[]>('/api/currencies'),
    getCurrent: (code: string) => http.get<Currency>(`/api/currencies/${code}`),
  },

  // History
  history: {
    getForCurrency: (currencyCode: string, startDate: string, endDate: string) => 
      http.get(`/api/history/${currencyCode}?startDate=${startDate}&endDate=${endDate}`),
    getMini: (currencyCode: string, startDate: string, endDate: string) => 
      http.get(`/api/history/${currencyCode}?startDate=${startDate}&endDate=${endDate}`),
  },

  // Alerts
  alerts: {
    getUserAlerts: (email: string) => http.get(`/api/alerts/${email}`),
    createAlert: (email: string, currencyCode: string, alertData: any) => 
      http.post(`/api/alerts/${email}/${currencyCode}`, alertData),
    removeAlert: (email: string, currencyCode: string) => 
      http.delete(`/api/alerts/${email}/${currencyCode}`),
    updateAlert: (email: string, currencyCode: string, alertData: any) => 
      http.put(`/api/alerts/${email}/${currencyCode}`, alertData),
  },

  // Auth
  auth: {
    login: (credentials: any) => http.post('/api/auth/login', credentials),
    logout: () => http.post('/api/auth/logout'),
    register: (userData: any) => http.post('/api/auth/register', userData),
    checkAuth: () => http.get('/api/auth/me'),
  }
};

// Tipos para as respostas da API
export interface Currency {
  id: number;
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
  change?: number;
  lastUpdate: string;
  displayOrder: number;
}

export interface UserAlert {
  limite?: number;
  tipo: 'subida' | 'descida' | 'valor-especifico';
  valor?: number;
  validade?: string | null;
  ativo: boolean;
  condicaoValor?: 'acima' | 'abaixo';
}

export interface UserAlerts {
  email: string;
  alerts: { [currencyCode: string]: UserAlert };
}
