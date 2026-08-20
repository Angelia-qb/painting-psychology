import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Calendar, Image, ShieldAlert, Award, HelpCircle } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:3001'
  : '';

export default function ReportViewer({ initialSessionId }) {
  const [searchId, setSearchId] = useState(initialSessionId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (initialSessionId) {
      fetchReport(initialSessionId);
    }
  }, [initialSessionId]);

  const fetchReport = async (sid) => {
    if (!sid.trim()) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`${API_BASE}/api/report/${sid}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '获取报告失败');
      }
      const resData = await response.json();
      setData(resData);
    } catch (err) {
      console.error(err);
      setError(err.message || '网络连接失败，请确保本地服务器已启动。');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport(searchId);
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <FileText className="icon-blue" size={28} />
        </div>
        <h2>查看您的心理分析报告</h2>
        <p className="subtitle">输入本地会话 ID (验证码) 即可直接获取分析结果</p>
      </div>

      <div className="card-body">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="请输入会话ID，例如: session_1786280119292"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary btn-search" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              查询报告
            </button>
          </div>
        </form>

        {error && (
          <div className="error-banner margin-top-sm">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="report-container margin-top-sm animate-fade-in">
            {/* Session Metadata */}
            <div className="report-meta-box">
              <div className="meta-item">
                <Calendar size={14} />
                <span>提交时间：{new Date(data.answers.timestamp).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <FileText size={14} />
                <span>作品名称：《{data.answers.drawingTitle || '未命名'}》</span>
              </div>
            </div>

            {/* Drawing Preview & Original Questionnaire Answers */}
            <div className="report-split-grid">
              <div className="report-image-panel">
                <h4 className="panel-title"><Image size={16} /> 上传的画作</h4>
                <div className="report-image-wrapper">
                  <img
                    src={`${API_BASE}/${data.answers.relativeImagePath}`}
                    alt="Submitted art"
                    className="report-img"
                  />
                </div>
              </div>

              <div className="report-answers-panel">
                <h4 className="panel-title"><HelpCircle size={16} /> 我的探索问答</h4>
                <div className="answers-scroll-box">
                  <div className="qa-item">
                    <h5>Q1. 画面主要描述了什么？</h5>
                    <p>{data.answers.description}</p>
                  </div>
                  <div className="qa-item">
                    <h5>Q2. 情绪与身体感受是什么？</h5>
                    <p>{data.answers.emotions}</p>
                  </div>
                  {data.answers.dialogue && (
                    <div className="qa-item">
                      <h5>Q3. 如果画中元素会说话，它会说什么？</h5>
                      <p>{data.answers.dialogue}</p>
                    </div>
                  )}
                  {data.answers.backgroundContext && (
                    <div className="qa-item">
                      <h5>Q4. 创作契机与背景是什么？</h5>
                      <p>{data.answers.backgroundContext}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis report section */}
            <div className="analysis-report-section">
              {!data.hasReport ? (
                <div className="pending-report-banner">
                  <Loader2 className="animate-spin text-primary" size={28} />
                  <div>
                    <h4>📊 分析数据已成功载入！但报告尚未生成</h4>
                    <p>
                      请在聊天窗口中回复 AI 助手：
                      <br />
                      <code>我已上传会话ID: {data.sessionId}，请在工作区生成并写入我的分析报告文件。</code>
                      <br />
                      AI 助手写入 <code>report.json</code> 文件后，本页面将自动显示您的完整报告！
                    </p>
                  </div>
                </div>
              ) : (
                <div className="report-content-box animate-fade-in">
                  <div className="report-header-badge">
                    <Award size={20} />
                    <span>AI 心理分析报告已生成</span>
                  </div>

                  <div className="report-summary-quote">
                    <p>“ {data.report.summary} ”</p>
                  </div>

                  <div className="dimensions-list">
                    {data.report.dimensions?.map((dim, idx) => (
                      <div key={idx} className="dimension-card">
                        <h4>{dim.title}</h4>
                        <p>{dim.content}</p>
                      </div>
                    ))}
                  </div>

                  {data.report.advices && data.report.advices.length > 0 && (
                    <div className="report-advice-box">
                      <h4>💡 心理恢复与探索建议</h4>
                      <ul>
                        {data.report.advices.map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.report.questions && data.report.questions.length > 0 && (
                    <div className="report-questions-box">
                      <h4>🤔 进一步自我觉察思考题</h4>
                      <ul>
                        {data.report.questions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="report-scientific-footer">
                    <p>本报告基于表达性艺术治疗原理生成。关于科学局限性及理论基础，可查看“科学附录”页面。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
