const BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`;

function getToken() {
  return localStorage.getItem('scaf_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// Bandera para evitar múltiples redirects simultáneos cuando varias llamadas retornan 401
let _redirecting = false;

async function handleResponse(res) {
  if (!res) return null; // error de red o CORS — el caller recibe null y maneja el caso
  if (res.status === 401) {
    if (!_redirecting) {
      _redirecting = true;
      localStorage.removeItem('scaf_token');
      localStorage.removeItem('scaf_user');
      window.location.href = '/login';
    }
    return null;
  }
  return res;
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: authHeaders(),
    }).catch(() => null);
    return handleResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).catch(() => null);
    return handleResponse(res);
  },

  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).catch(() => null);
    return handleResponse(res);
  },

  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).catch(() => null);
    return handleResponse(res);
  },

  // Para subida de archivos — NO incluir Content-Type, el browser lo establece con boundary
  upload: async (path, formData) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).catch(() => null);
    return handleResponse(res);
  },
};

export { BASE_URL };
