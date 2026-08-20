import crypto from 'crypto';

/**
 * 会话令牌（无状态签名 token）
 *
 * 结构：base64url(payload).base64url(hmac)
 * 用 SESSION_SECRET 签名，服务端不存储会话，重启后仍然有效。
 */

const DEFAULT_TTL_MS = 30 * 24 * 3600 * 1000; // 30 天

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

export function createAuth({ secret, ttlMs = DEFAULT_TTL_MS }) {
  if (!secret) throw new Error('createAuth 需要 secret');

  function sign(payloadB64) {
    return b64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());
  }

  function issueToken(user) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + ttlMs
    };
    const payloadB64 = b64url(JSON.stringify(payload));
    return `${payloadB64}.${sign(payloadB64)}`;
  }

  function verifyToken(token) {
    if (typeof token !== 'string' || !token.includes('.')) return null;

    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

    const expected = sign(payloadB64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    let payload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    } catch {
      return null;
    }

    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  }

  /** 从 Cookie 或 Authorization 头中取出用户，挂到 req.user（可为 null） */
  function attachUser(req, res, next) {
    const fromHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const fromCookie = parseCookies(req.headers.cookie)['mindart_token'];
    req.user = verifyToken(fromHeader || fromCookie) || null;
    next();
  }

  /** 要求已登录 */
  function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: '请先登录' });
    next();
  }

  /** 要求管理员 */
  function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: '请先登录' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  }

  return { issueToken, verifyToken, attachUser, requireAuth, requireAdmin };
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export const COOKIE_NAME = 'mindart_token';

export function cookieOptions(req) {
  // 部署在 Cloudflare/nginx 后面时用 x-forwarded-proto 判断是否 https
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: proto === 'https',
    maxAge: DEFAULT_TTL_MS,
    path: '/'
  };
}
