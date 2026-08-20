import crypto from 'crypto';

/**
 * 短码：给人用的 ID
 *
 * 格式 XXXX-XXXX，例如 K7F2-Q9WM
 * 字母表去掉了容易看错的 0/O、1/I/L、U/V 中的 U，共 29 个字符。
 * 29^8 ≈ 5.0e11 种组合。
 *
 * ⚠️ 安全说明：短码比原来的 24 位十六进制 sessionId 熵低很多。
 * 由于报告接口没有登录鉴权，必须配合 rateLimit.js 使用，
 * 否则存在被暴力枚举的风险。
 */

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTWXYZ';

export function newShortCode() {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3) out += '-';
  }
  return out;
}

/**
 * 规范化用户输入：容忍小写、缺失连字符、多余空格
 * 'k7f2q9wm' / 'K7F2 Q9WM' / 'K7F2-Q9WM' 都能识别
 *
 * 注：字母表已排除 0/1/I/L/O/U 等易混字符，因此不需要形近字纠正 ——
 * 这些字符本就不会出现在合法短码中。
 */
export function normalizeShortCode(input) {
  if (typeof input !== 'string') return null;

  const s = input.trim().toUpperCase().replace(/[\s-]/g, '');

  if (s.length !== 8) return null;
  if (![...s].every((c) => ALPHABET.includes(c))) return null;

  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export function isShortCode(input) {
  return normalizeShortCode(input) !== null;
}
