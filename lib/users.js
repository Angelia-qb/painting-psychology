import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * 用户存储
 *
 * 使用 scrypt 做密码哈希（Node 内置，无需额外依赖）。
 * 每个用户独立 salt，校验时用 timingSafeEqual 防时序攻击。
 */

const SCRYPT_KEYLEN = 64;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, expected] = stored.split(':');

  let actual;
  try {
    actual = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  } catch {
    return false;
  }

  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function createUserStore(dataDir) {
  const USERS_FILE = path.join(dataDir, 'users.json');

  function readAll() {
    if (!fs.existsSync(USERS_FILE)) return {};
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }

  function writeAll(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  }

  // 用户名统一小写作为键，避免大小写混淆导致重复注册
  const keyOf = (username) => String(username || '').trim().toLowerCase();

  return {
    list() {
      return Object.values(readAll()).map(({ passwordHash: _ph, ...safe }) => safe);
    },

    findByName(username) {
      return readAll()[keyOf(username)] || null;
    },

    findById(id) {
      return Object.values(readAll()).find((u) => u.id === id) || null;
    },

    count() {
      return Object.keys(readAll()).length;
    },

    create({ username, password, role = 'user' }) {
      const key = keyOf(username);
      if (!key) throw new Error('用户名不能为空');
      if (key.length < 2 || key.length > 20) throw new Error('用户名长度需在 2~20 之间');
      if (!/^[a-z0-9_\u4e00-\u9fa5-]+$/.test(key)) {
        throw new Error('用户名只能包含中文、字母、数字、下划线和连字符');
      }
      if (!password || password.length < 6) throw new Error('密码至少 6 位');

      const users = readAll();
      if (users[key]) throw new Error('该用户名已被注册');

      const user = {
        id: `u_${crypto.randomBytes(8).toString('hex')}`,
        username: String(username).trim(),
        role,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      };

      users[key] = user;
      writeAll(users);

      const { passwordHash: _ph, ...safe } = user;
      return safe;
    },

    verify(username, password) {
      const user = readAll()[keyOf(username)];
      if (!user) return null;
      if (!verifyPassword(password, user.passwordHash)) return null;

      const { passwordHash: _ph, ...safe } = user;
      return safe;
    },

    setPassword(username, password) {
      if (!password || password.length < 6) throw new Error('密码至少 6 位');
      const users = readAll();
      const key = keyOf(username);
      if (!users[key]) throw new Error('用户不存在');

      users[key].passwordHash = hashPassword(password);
      writeAll(users);
    },

    remove(id) {
      const users = readAll();
      const key = Object.keys(users).find((k) => users[k].id === id);
      if (!key) return false;
      delete users[key];
      writeAll(users);
      return true;
    }
  };
}
