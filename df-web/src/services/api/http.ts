/**
 * Cliente HTTP (axios) para o backend df-api.
 *
 * - `withCredentials: true` para que o cookie httpOnly `df_session` seja
 *   enviado em todas as requisições.
 * - Erros do backend (`{ erro, mensagem, detalhes }`) são convertidos em
 *   `ApiError` com a mensagem em português retornada pelo servidor.
 * - O `baseURL` vem de `import.meta.env.VITE_API_URL` (ver `.env.example`).
 */
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

const baseURL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3333').replace(/\/$/, '');

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

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

// Converte qualquer falha do axios em uma `ApiError` com a mensagem do backend.
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
        mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        detalhes: error.message,
      });
    }
    throw new ApiError(0, { erro: 'INTERNO', mensagem: error.message });
  },
);

type ParamValue = string | number | boolean | undefined | null;
type Params = Record<string, ParamValue>;

function limparParams(params?: Params): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

export const api = {
  get: async <T>(path: string, params?: Params, config?: AxiosRequestConfig) => {
    const res = await httpClient.get<T>(path, { ...config, params: limparParams(params) });
    return res.data;
  },
  post: async <T, B = unknown>(path: string, body?: B, config?: AxiosRequestConfig) => {
    const res = await httpClient.post<T>(path, body ?? {}, config);
    return res.data;
  },
  put: async <T, B = unknown>(path: string, body?: B, config?: AxiosRequestConfig) => {
    const res = await httpClient.put<T>(path, body ?? {}, config);
    return res.data;
  },
  patch: async <T, B = unknown>(path: string, body?: B, config?: AxiosRequestConfig) => {
    const res = await httpClient.patch<T>(path, body ?? {}, config);
    return res.data;
  },
  delete: async <T = void>(path: string, config?: AxiosRequestConfig) => {
    const res = await httpClient.delete<T>(path, config);
    return res.data;
  },
};
