import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Coins, Copy, Check, Loader2, Users, ShoppingCart, Info } from 'lucide-react';

export default function MyAccount({ apiBase }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [qty, setQty] = useState(5);
  const [ordering, setOrdering] = useState(false);
  const [orderMsg, setOrderMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/api/me/account`, { credentials: 'include' });
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const buy = async () => {
    setOrdering(true);
    setOrderMsg('');
    try {
      const r = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: qty })
      });
      const d = await r.json();
      setOrderMsg(
        d.payment?.ready
          ? '订单已创建，请完成支付'
          : `订单已创建（${d.order.id}）。支付功能尚未开通，请联系管理员确认。`
      );
      load();
    } finally {
      setOrdering(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="card animate-fade-in">
        <div className="card-body my-reports-empty">
          <Loader2 className="animate-spin" size={18} /> <span>加载中…</span>
        </div>
      </div>
    );
  }

  const site = data.shareUrl || window.location.origin;
  const unused = data.inviteCodes.filter((c) => !c.used);

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <Coins className="icon-gold" size={28} />
        </div>
        <h2>我的账户</h2>
        <p className="subtitle">次数、邀请与奖励</p>
      </div>

      <div className="card-body scrollable-body">
        {/* 额度概览 */}
        <div className="acct-grid">
          <div className="acct-box">
            <span className="acct-num">{data.quota.remainingToday}</span>
            <span className="acct-label">今日免费剩余</span>
            <span className="acct-sub">每天 {data.quota.dailyLimit} 次</span>
          </div>
          <div className="acct-box highlight">
            <span className="acct-num">{data.credits}</span>
            <span className="acct-label">我的次数包</span>
            <span className="acct-sub">免费用完后自动使用</span>
          </div>
          <div className="acct-box">
            <span className="acct-num">{data.inviteStats.used}</span>
            <span className="acct-label">成功邀请</span>
            <span className="acct-sub">每人 +{data.inviteReward} 次</span>
          </div>
        </div>

        {/* 邀请码 */}
        <h4 className="acct-section">
          <Gift size={16} /> 今日邀请码
        </h4>
        <p className="acct-desc">
          每天可领 {data.inviteCodes.length} 个，每个码限 1 人使用。
          朋友注册成功后，你获得 <strong>{data.inviteReward} 次</strong>免费分析。
        </p>

        <ul className="invite-list">
          {data.inviteCodes.map((c) => (
            <li key={c.code} className={`invite-item ${c.used ? 'dead' : ''}`}>
              <div className="invite-main">
                <code className="invite-code">{c.code}</code>
                <span className="invite-meta">
                  {c.used ? `已被 ${c.usedBy} 使用` : '未使用'}
                </span>
              </div>
              {!c.used && (
                <div className="invite-actions">
                  <button
                    onClick={() =>
                      copy(
                        `我在用 MindArt 做绘画心理探索，挺有意思的。\n${site}\n邀请码：${c.code}`,
                        c.code
                      )
                    }
                    title="复制邀请语"
                  >
                    {copied === c.code ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {unused.length === 0 && (
          <p className="acct-desc">今天的邀请码都用完了，明天再来领 ✨</p>
        )}

        {data.inviteStats.invitees.length > 0 && (
          <p className="acct-desc">
            <Users size={13} style={{ verticalAlign: '-2px' }} /> 已邀请：
            {data.inviteStats.invitees.join('、')}
          </p>
        )}

        {/* 购买 */}
        <h4 className="acct-section">
          <ShoppingCart size={16} /> 购买次数
        </h4>
        <p className="acct-desc">
          {(data.pricePerAnalysisFen / 100).toFixed(0)} 元 / 次，购买的次数长期有效。
        </p>

        <div className="buy-row">
          <select className="form-input" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
            {[1, 3, 5, 10, 20].map((n) => (
              <option key={n} value={n}>
                {n} 次 · ¥{(n * data.pricePerAnalysisFen) / 100}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={buy} disabled={ordering}>
            {ordering ? <Loader2 className="animate-spin" size={16} /> : null}
            购买
          </button>
        </div>

        {orderMsg && (
          <div className="alert alert-warning" style={{ marginTop: '0.75rem' }}>
            <Info size={18} className="alert-icon" />
            <div className="alert-content">
              <p>{orderMsg}</p>
            </div>
          </div>
        )}

        {/* 流水 */}
        {data.ledger.length > 0 && (
          <>
            <h4 className="acct-section">次数记录</h4>
            <ul className="ledger-list">
              {data.ledger.map((e) => (
                <li key={e.id}>
                  <span className={e.amount > 0 ? 'ledger-plus' : 'ledger-minus'}>
                    {e.amount > 0 ? '+' : ''}
                    {e.amount}
                  </span>
                  <span className="ledger-reason">
                    {{
                      invite_reward: `邀请 ${e.meta?.inviteeName || ''} 奖励`,
                      purchase: '购买',
                      analysis: '分析消耗',
                      admin_grant: '管理员赠送'
                    }[e.reason] || e.reason}
                  </span>
                  <span className="ledger-date">{new Date(e.at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
