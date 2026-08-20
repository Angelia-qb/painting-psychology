import React, { useState, useEffect } from 'react';
import { History, Trash2, FileText, Inbox } from 'lucide-react';
import { loadMyReports, removeMyReport } from '../lib/myReports';

export default function MyReports({ onOpen }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(loadMyReports());
  }, []);

  const handleRemove = (e, sessionId) => {
    e.stopPropagation();
    setList(removeMyReport(sessionId));
  };

  if (!list.length) {
    return (
      <div className="my-reports-empty">
        <Inbox size={20} />
        <span>这台设备上还没有报告记录</span>
      </div>
    );
  }

  return (
    <div className="my-reports">
      <h4 className="my-reports-title">
        <History size={16} /> 我的报告
      </h4>

      <ul className="my-reports-list">
        {list.map((item) => (
          <li
            key={item.sessionId}
            className="my-reports-item"
            onClick={() => onOpen(item.shortCode || item.sessionId)}
          >
            <div className="my-reports-main">
              <span className="my-reports-name">《{item.title}》</span>
              <code className="my-reports-code">{item.shortCode || item.sessionId}</code>
            </div>
            <div className="my-reports-side">
              <span className="my-reports-date">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
              <button
                className="my-reports-open"
                title="查看报告"
                onClick={() => onOpen(item.shortCode || item.sessionId)}
              >
                <FileText size={14} />
              </button>
              <button
                className="my-reports-del"
                title="从本机记录中移除"
                onClick={(e) => handleRemove(e, item.sessionId)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="my-reports-note">
        记录只保存在这台设备的浏览器里。换设备或清理浏览器数据后会消失，请把查询码抄下来。
      </p>
    </div>
  );
}
