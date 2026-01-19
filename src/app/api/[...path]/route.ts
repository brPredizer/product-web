import { API_BASE_URL } from '@/app/api/api';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade'
]);

const copyHeaders = (from: Headers, to: Headers) => {
  for (const [k, v] of from) {
    const key = k.toLowerCase();
    if (HOP_BY_HOP.has(key)) continue;
    to.set(k, v);
  }
};

const buildTargetUrl = (params: { path?: string[] }, req: Request) => {
  const parts = params?.path ?? [];
  const joined = Array.isArray(parts) ? parts.join('/') : String(parts || '');
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = joined ? `/${joined.replace(/^\/+/, '')}` : '';
  const incoming = new URL(req.url);
  const target = new URL(base + path);
  target.search = incoming.search;
  return target.toString();
};

const proxyHandler = async (req: Request, { params }: { params: { path?: string[] } }) => {
  const url = buildTargetUrl(params, req);

  const headers = new Headers();
  // Forward most headers (including cookie and authorization)
  copyHeaders(req.headers, headers);
  // Ensure host is target host
  headers.set('x-forwarded-host', req.headers.get('host') || '');

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();

  const resp = await fetch(url, {
    method: req.method,
    headers,
    body: body === '' ? undefined : body,
    redirect: 'manual'
  });

  const resHeaders = new Headers();
  copyHeaders(resp.headers, resHeaders);

  // If backend sets cookies, forward them to client
  const setCookie = resp.headers.get('set-cookie');
  if (setCookie) {
    resHeaders.set('set-cookie', setCookie);
  }

  const arrayBuffer = await resp.arrayBuffer();
  return new Response(arrayBuffer, {
    status: resp.status,
    headers: resHeaders
  });
};

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const PATCH = proxyHandler;
export const DELETE = proxyHandler;
export const OPTIONS = proxyHandler;

export default proxyHandler;
