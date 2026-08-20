/**
 * 极简内存限流
 *
 * 因为短码熵较低且报告接口无鉴权，必须限制查询频率来阻止暴力枚举。
 * 单进程内存实现，重启即清空；多实例部署时应换成 Redis。
 */

const buckets = new Map();

function prune(now) {
  for (const [key, hits] of buckets) {
    const alive = hits.filter((t) => now - t < 3600_000);
    if (alive.length) buckets.set(key, alive);
    else buckets.delete(key);
  }
}

let lastPrune = Date.now();

/**
 * @param {object} opts
 * @param {number} opts.windowMs 时间窗口
 * @param {number} opts.max      窗口内最大请求数
 * @param {string} opts.scope    区分不同接口的命名空间
 */
export function rateLimit({ windowMs, max, scope, message }) {
  return (req, res, next) => {
    const now = Date.now();

    if (now - lastPrune > 300_000) {
      prune(now);
      lastPrune = now;
    }

    // 取真实客户端 IP（部署在 Cloudflare/nginx 后面时 req.ip 是代理地址）
    const ip =
      req.headers['cf-connecting-ip'] ||
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.ip ||
      'unknown';

    const key = `${scope}:${ip}`;
    const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

    if (hits.length >= max) {
      const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message || `请求过于频繁，请 ${retryAfter} 秒后再试`
      });
    }

    hits.push(now);
    buckets.set(key, hits);
    next();
  };
}
