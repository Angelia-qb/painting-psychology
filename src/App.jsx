import React, { useState } from 'react';
import Introduction from './components/Introduction';
import DrawingGuide from './components/DrawingGuide';
import ImageUploader from './components/ImageUploader';
import GuidedInquiry from './components/GuidedInquiry';
import Success from './components/Success';
import ReportViewer from './components/ReportViewer';
import Appendix from './components/Appendix';
import './App.css';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:3001'
  : '';

export default function App() {
  const [activeTab, setActiveTab] = useState('test'); // 'test' | 'report' | 'appendix'
  const [step, setStep] = useState(0);
  const [drawing, setDrawing] = useState(null);
  const [answers, setAnswers] = useState({
    drawingTitle: '',
    description: '',
    emotions: '',
    dialogue: '',
    backgroundContext: ''
  });
  const [sessionId, setSessionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleRestart = () => {
    setStep(0);
    setDrawing(null);
    setAnswers({
      drawingTitle: '',
      description: '',
      emotions: '',
      dialogue: '',
      backgroundContext: ''
    });
    setSessionId('');
    setSubmitError('');
  };

  const handleFinalSubmit = async () => {
    if (!drawing?.file) return;
    
    setIsSubmitting(true);
    setSubmitError('');

    const formData = new FormData();
    formData.append('drawing', drawing.file);
    formData.append('drawingTitle', answers.drawingTitle);
    formData.append('description', answers.description);
    formData.append('emotions', answers.emotions);
    formData.append('dialogue', answers.dialogue);
    formData.append('backgroundContext', answers.backgroundContext);

    try {
      // Connect dynamically depending on dev/prod port
      const response = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败，请重试');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setStep(4); // Move to Success screen
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err.message || '网络连接失败，请确保本地服务器正在运行。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsConfig = [
    { title: '介绍', active: step >= 0 },
    { title: '准备', active: step >= 1 },
    { title: '上传', active: step >= 2 },
    { title: '问卷', active: step >= 3 },
    { title: '完成', active: step >= 4 }
  ];

  return (
    <div className="app-container">
      {/* Background decoration elements */}
      <div className="glow-sphere glow-1"></div>
      <div className="glow-sphere glow-2"></div>

      <header className="app-header">
        <div className="brand" onClick={() => { setActiveTab('test'); handleRestart(); }} style={{ cursor: 'pointer' }}>
          <span className="brand-logo">🎨</span>
          <span className="brand-name">MindArt Studio</span>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="app-nav">
          <button 
            className={`nav-btn ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            开始测试
          </button>
          <button 
            className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            查看报告
          </button>
          <button 
            className={`nav-btn ${activeTab === 'appendix' ? 'active' : ''}`}
            onClick={() => setActiveTab('appendix')}
          >
            科学附录
          </button>
        </nav>

        {/* Stepper (Only visible during Test taking) */}
        {activeTab === 'test' && (
          <div className="stepper">
            {stepsConfig.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className={`step-node ${step === idx ? 'current' : ''} ${step > idx ? 'completed' : ''}`}>
                  <div className="step-number">{idx + 1}</div>
                  <div className="step-label">{s.title}</div>
                </div>
                {idx < stepsConfig.length - 1 && (
                  <div className={`step-line ${step > idx ? 'completed' : ''}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      <main className="app-main">
        {submitError && (
          <div className="global-error-banner animate-fade-in">
            <p>{submitError}</p>
            <button className="btn-close-error" onClick={() => setSubmitError('')}>✕</button>
          </div>
        )}

        {/* Tab View Routing */}
        {activeTab === 'test' && (
          <>
            {step === 0 && <Introduction onNext={nextStep} />}
            {step === 1 && <DrawingGuide onNext={nextStep} onPrev={prevStep} />}
            {step === 2 && (
              <ImageUploader
                drawing={drawing}
                setDrawing={setDrawing}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {step === 3 && (
              <GuidedInquiry
                answers={answers}
                setAnswers={setAnswers}
                onSubmit={handleFinalSubmit}
                onPrev={prevStep}
                isSubmitting={isSubmitting}
              />
            )}
            {step === 4 && (
              <Success 
                sessionId={sessionId} 
                onRestart={handleRestart}
                onViewReport={() => setActiveTab('report')}
              />
            )}
          </>
        )}

        {activeTab === 'report' && (
          <ReportViewer initialSessionId={sessionId} />
        )}

        {activeTab === 'appendix' && (
          <Appendix />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 MindArt Studio. 本地运行，绝对保护您的隐私安全。</p>
      </footer>
    </div>
  );
}
