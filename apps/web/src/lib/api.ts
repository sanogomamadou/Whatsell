// Client HTTP centralisé — TOUTES les requêtes frontend passent par ici
// credentials: 'include' obligatoire pour les cookies JWT httpOnly

function getBaseUrl(): string {
  // NEXT_PUBLIC_API_URL est inliné au build-time par Next.js.
  // En dev il vaut la valeur du .env.local ; en prod il doit être défini
  // dans les variables d'environnement de la plateforme de déploiement.
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function apiClient(
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const { headers: extraHeaders, body, ...restOptions } = options ?? {};

  // Content-Type uniquement quand un body est présent (pas sur GET/DELETE)
  const contentTypeHeader: Record<string, string> =
    body !== undefined ? { 'Content-Type': 'application/json' } : {};

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${endpoint}`, {
      credentials: 'include', // OBLIGATOIRE — cookies JWT httpOnly
      headers: {
        ...contentTypeHeader,
        ...(extraHeaders as Record<string, string>),
      },
      body,
      ...restOptions,
    });
  } catch (networkError: unknown) {
    throw new Error(
      `Erreur réseau lors de ${options?.method ?? 'GET'} ${endpoint} : ${
        networkError instanceof Error ? networkError.message : String(networkError)
      }`,
    );
  }

  return response;
}

async function parseJsonSafe<T>(response: Response, label: string): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `${label} : réponse non-JSON reçue (content-type: ${contentType})`,
    );
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`GET ${endpoint} échoué : ${response.status}`);
  }
  return parseJsonSafe<T>(response, `GET ${endpoint}`);
}

export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await apiClient(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${endpoint} échoué : ${response.status}`);
  }
  return parseJsonSafe<T>(response, `POST ${endpoint}`);
}

export async function apiPatch<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await apiClient(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`PATCH ${endpoint} échoué : ${response.status}`);
  }
  return parseJsonSafe<T>(response, `PATCH ${endpoint}`);
}

export async function apiDelete(endpoint: string): Promise<void> {
  const response = await apiClient(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    // Tente de lire un éventuel message d'erreur JSON dans la réponse
    let detail = '';
    try {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = (await response.json()) as { message?: string };
        detail = data.message ? ` — ${data.message}` : '';
      }
    } catch {
      // corps non lisible, on ignore
    }
    throw new Error(`DELETE ${endpoint} échoué : ${response.status}${detail}`);
  }
}
