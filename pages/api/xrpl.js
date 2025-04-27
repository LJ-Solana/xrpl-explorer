import { createProxyMiddleware } from 'http-proxy-middleware';

const proxy = createProxyMiddleware({
  target: 'https://s.altnet.rippletest.net:51234',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/api/xrpl': '', // Remove the /api/xrpl prefix when forwarding the request
  },
});

export default function handler(req, res) {
  proxy(req, res, (result) => {
    if (result instanceof Error) {
      throw result;
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 