/**
 * Cliente HTTP (axios) para o backend df-api.
 *
 * Usa Bearer token em vez de cookie httpOnly (cookies em React Native são
 * inconvenientes — precisariam de bibliotecas extras). O token é guardado em
 * AsyncStorage pelo auth store e injetado pelo interceptor.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';

const apiUrlConfig =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3333';

export const baseURL = apiUrlConfig.replace(/\/$/, '');

export interface ApiErrorPayload {
  erro: string;
  mensagem: string;
  detalhes?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes?: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.mensagem || 'Erro na requisição.');
    this.name = 'ApiError';
    this.status = status;
    this.codigo = payload.erro;
    this.detalhes = payload.detalhes;
  }
}

let tokenAtual: string | null = null;

export function setarToken(token: string | null) {
  tokenAtual = token;
}

/** Lê o token atual do interceptor — útil para downloads diretos via
 *  `FileSystem.downloadAsync` que não passam pelo axios. */
export function obterToken(): string | null {
  return tokenAtual;
}

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 15_000,
});

httpClient.interceptors.request.use((config) => {
  if (tokenAtual) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokenAtual}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response) {
      const data = error.response.data;
      throw new ApiError(error.response.status, {
        erro: data?.erro ?? 'ERRO',
        mensagem:
          data?.mensagem ??
          `Erro ${error.response.status}: ${error.response.statusText || 'falha na requisição'}.`,
        detalhes: data?.detalhes,
      });
    }
    if (error.request) {
      throw new ApiError(0, {
        erro: 'REDE',
        mensagem:
          'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        detalhes: error.message,
      });
    }
    throw new ApiError(0, { erro: 'INTERNO', mensagem: error.message });
  },
);

type ParamValue = string | number | boolean | undefined | null;
export type Params = Record<string, ParamValue>;

function limparParams(
  params?: Params,
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

export const api = {
  get: async <T>(
    path: string,
    params?: Record<string, ParamValue>,
    config?: AxiosRequestConfig,
  ) => {
    const res = await httpClient.get<T>(path, {
      ...config,
      params: limparParams(params),
    });
    return res.data;
  },
  post: async <T, B = unknown>(
    path: string,
    body?: B,
    config?: AxiosRequestConfig,
  ) => {
    const res = await httpClient.post<T>(path, body ?? {}, config);
    return res.data;
  },
  patch: async <T, B = unknown>(
    path: string,
    body?: B,
    config?: AxiosRequestConfig,
  ) => {
    const res = await httpClient.patch<T>(path, body ?? {}, config);
    return res.data;
  },
  delete: async <T = void>(path: string, config?: AxiosRequestConfig) => {
    const res = await httpClient.delete<T>(path, config);
    return res.data;
  },
};
