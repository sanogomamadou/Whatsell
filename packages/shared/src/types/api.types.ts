// Format de réponse API uniforme — imposé par ResponseWrapperInterceptor NestJS
// Toutes les réponses API respectent ce format

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
