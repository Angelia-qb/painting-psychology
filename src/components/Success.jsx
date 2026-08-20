import React, { useState } from 'react';
import { CheckCircle2, Clipboard, ClipboardCheck, FileText, RefreshCw } from 'lucide-react';

export default function Success({ sessionId, onRestart, onViewReport }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `我已完成画作上传，我的本地会话ID是: ${sessionId}。请读取该会话的数据并为我做绘画心理学分析报告，并写入 report.json 中让我能在网页上看到报告。`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card animate-fade-in text-center">
      <div className="card-header text-center-header">
        <div className="icon-badge-success">
          <CheckCircle2 size={36} className="icon-green" />
        </div>
        <h2 className="gradient-text-success">上传成功！</h2>
        <p className="subtitle">您的画作与问卷已安全存入本地工作区</p>
      </div>

      <div className="card-body">
        <div className="session-info-box">
          <p className="session-label">本地会话 ID</p>
          <div className="session-value-container">
            <code className="session-value">{sessionId}</code>
          </div>
          <p className="session-path-note">
            数据保存在本地：<code>data/sessions/{sessionId}/</code>
          </p>
        </div>

        <div className="next-steps-container">
          <h3>👉 后续流程 (如何获取心理分析)：</h3>
          <ol className="steps-ordered-list">
            <li>点击下方按钮，复制分析指令并发送给 <strong>AI 助手（Antigravity）</strong>。</li>
            <li>AI 助手将在本地工作区为您生成深度的分析报告文件。</li>
            <li>点击“前往报告页”按钮，即可直接在网页上查看生成的报告！</li>
          </ol>
        </div>
      </div>

      <div className="card-footer-stacked">
        <button className="btn btn-success btn-full" onClick={handleCopy}>
          {copied ? (
            <>
              <ClipboardCheck size={18} />
              指令已复制！
            </>
          ) : (
            <>
              <Clipboard size={18} />
              第一步：复制分析指令
            </>
          )}
        </button>
        <button className="btn btn-primary btn-full margin-top-sm" onClick={onViewReport}>
          <FileText size={18} />
          第二步：前往报告页
        </button>
        <button className="btn btn-text btn-full margin-top-sm" onClick={onRestart}>
          <RefreshCw size={14} /> 上传另一张画作
        </button>
      </div>
    </div>
  );
}
