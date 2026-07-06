import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

export interface MockAuthOptions {
  username: string;
  roles: string[];
  expiresIn: number;
}

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const pathname = (url: string): string => url.split('?')[0] ?? url;

const isLoginInfo = (method: string | undefined, url: string): boolean =>
  method === 'GET' && pathname(url) === '/api/login/info';

const isLoginRefresh = (method: string | undefined, url: string): boolean =>
  method === 'GET' && pathname(url) === '/api/login/refresh';

const isLoginStart = (method: string | undefined, url: string): boolean =>
  method === 'GET' && pathname(url) === '/api/login';

const isLoginCallback = (method: string | undefined, url: string): boolean =>
  method === 'POST' && pathname(url) === '/api/login';

const isLogout = (method: string | undefined, url: string): boolean =>
  method === 'POST' && pathname(url) === '/api/logout';

const handleMockAuth = (
  req: IncomingMessage,
  res: ServerResponse,
  options: MockAuthOptions,
  next: () => void,
): void => {
  const url = req.url ?? '';

  if (!url.startsWith('/api/login') && url !== '/api/logout') {
    next();
    return;
  }

  if (isLoginInfo(req.method, url)) {
    sendJson(res, 200, { username: options.username, roles: options.roles });
    return;
  }

  if (isLoginRefresh(req.method, url)) {
    sendJson(res, 200, { expiresIn: options.expiresIn });
    return;
  }

  if (isLoginCallback(req.method, url)) {
    sendJson(res, 200, { expiresIn: options.expiresIn });
    return;
  }

  if (isLogout(req.method, url)) {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (isLoginStart(req.method, url)) {
    const redirectBase = new URL(url, 'http://vite.local').searchParams.get('redirect_base');
    sendJson(res, 200, { url: redirectBase ? decodeURIComponent(redirectBase) : '/' });
    return;
  }

  next();
};

export const mockAuthPlugin = (options: MockAuthOptions): Plugin => ({
  name: 'mock-auth',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      handleMockAuth(req, res, options, next);
    });
  },
});
