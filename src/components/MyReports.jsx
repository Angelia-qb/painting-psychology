import React, { useState, useEffect, useCallback } from 'react';
import { History, FileText, Inbox, Loader2, Users, Crown } from 'lucide-react';

export default function MyReports({ apiBase, user, onOpen }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminView, setAdminView] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = useCallback(
    async (all) => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/my-reports${all ? '?all=1' : ''}`, {
          credentials: 'include'
        });
        const data = await res.json();
        setItems(res.ok ? data.items || [] : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    load(adminView);
  }, [load, adminView]);

  return (
    <div className="my-reports">
      <div className="my-reports-head">
        <h4 className="my-reports-title">
          {adminView ? <Users size={16} /> : <History size={16} />}
          {adminView ? '全部用户的报告' : '我的报告'}
        </h4>

        {isAdmin && (
          <button
            className={`admin-toggle ${adminView ? 'active' : ''}`}
            onClick={() => setAdminView(!adminView)}
            title="管理员视图"
          >
            <Crown size={13} />
            {adminView ? '只看我的' : '查看全部'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="my-reports-empty">
          <Loader2 className="animate-spin" size={18} />
          <span>加载中…</span>
        </div>
      ) : !items.length ? (
        <div className="my-reports-empty">
          <Inbox size={20} />
          <span>{adminView ? '还没有任何用户提交报告' : '你还没有提交过画作'}</span>
        </div>
      ) : (
        <ul className="my-reports-list">
          {items.map((item) => (
            <li
              key={item.sessionId}
              className="my-reports-item"
              onClick={() => onOpen(item.shortCode || item.sessionId)}
            >
              <div className="my-reports-main">
                <span className="my-reports-name">
                  《{item.title}》
                  {!item.hasReport && <span className="pending-tag">生成中</span>}
                </span>
                <code className="my-reports-code">
                  {item.shortCode || item.sessionId}
                  {adminView && item.ownerName && (
                    <span className="owner-tag">@{item.ownerName}</span>
                  )}
                </code>
              </div>
              <div className="my-reports-side">
                <span className="my-reports-date">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
                <button className="my-reports-open" title="查看报告">
                  <FileText size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="my-reports-note">
        {adminView
          ? '管理员视图：这里列出所有用户提交的报告。'
          : '报告与账号绑定，换设备登录后依然可以看到。'}
      </p>
    </div>
  );
}
