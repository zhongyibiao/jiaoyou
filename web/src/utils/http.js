/**
 * 前端 API 客户端
 * - 请求/响应拦截
 * - 自动重试
 * - 简单内存缓存
 */

const cache = new Map();
const CACHE_TTL = 30_000;

async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${url}`;
  if (method === 'GET' && cache.has(cacheKey)) {
    const { data, expires } = cache.get(cacheKey);
    if (Date.now() < expires) return data;
    cache.delete(cacheKey);
  }

  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || '请求失败');
    err.code = json.code;
    err.status = res.status;
    throw err;
  }
  if (method === 'GET') {
    cache.set(cacheKey, { data: json, expires: Date.now() + CACHE_TTL });
  }
  return json;
}

export const http = {
  get: (url, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(url + qs);
  },
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
