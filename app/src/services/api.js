const API_URL = import.meta.env.VITE_API_URL

export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw {
      status: response.status,
      ...data, 
    };
  }
  return data;
}
