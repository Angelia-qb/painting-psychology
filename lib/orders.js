import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * 订单
 *
 * ⚠️ 支付网关未接入。
 *
 * 微信支付/支付宝需要企业主体、商户号与备案域名，这些必须由小仙女本人申请，
 * 我无法也不应代办。因此这里把订单流程做完整，支付部分留成可插拔接口：
 *   - PAYMENT_PROVIDER=mock   开发调试，下单后手动标记支付成功
 *   - PAYMENT_PROVIDER=wechat 待接入，填入商户号即可启用
 *
 * 金额单位一律用「分」，避免浮点误差。
 */

export const PRICE_PER_ANALYSIS_FEN = 600; // 6 元/次

export function createOrderStore(dataDir) {
  const FILE = path.join(dataDir, 'orders.json');

  const readAll = () => {
    if (!fs.existsSync(FILE)) return {};
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      return {};
    }
  };

  const writeAll = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf-8');

  return {
    create({ userId, username, quantity }) {
      const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
      const all = readAll();

      const order = {
        id: `o_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        userId,
        username,
        quantity: qty,
        unitPriceFen: PRICE_PER_ANALYSIS_FEN,
        totalFen: qty * PRICE_PER_ANALYSIS_FEN,
        status: 'pending', // pending | paid | cancelled
        provider: process.env.PAYMENT_PROVIDER || 'mock',
        createdAt: new Date().toISOString(),
        paidAt: null
      };

      all[order.id] = order;
      writeAll(all);
      return order;
    },

    get(id) {
      return readAll()[id] || null;
    },

    /** 标记已支付。返回订单，重复调用不会重复发放 */
    markPaid(id, meta = {}) {
      const all = readAll();
      const o = all[id];
      if (!o) return null;
      if (o.status === 'paid') return { ...o, alreadyPaid: true };

      o.status = 'paid';
      o.paidAt = new Date().toISOString();
      o.paymentMeta = meta;
      writeAll(all);
      return o;
    },

    cancel(id) {
      const all = readAll();
      const o = all[id];
      if (!o || o.status === 'paid') return null;
      o.status = 'cancelled';
      writeAll(all);
      return o;
    },

    listByUser(userId) {
      return Object.values(readAll())
        .filter((o) => o.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    },

    all() {
      return Object.values(readAll()).sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt))
      );
    }
  };
}
