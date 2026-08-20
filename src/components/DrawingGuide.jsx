import React from 'react';
import { PenTool, CheckCircle, ArrowRight } from 'lucide-react';

export default function DrawingGuide({ onNext, onPrev }) {
  const tips = [
    '准备一张白纸和画笔（铅笔、蜡笔、水彩皆可），或者使用您的平板电脑/电脑绘画软件。',
    '闭上眼睛，深呼吸三次，感受您此时此刻的身体状态和脑海中浮现的意象。',
    '抛开“画得像不像”或“美不美”的评判，跟随您的直觉去画。涂鸦、线条、抽象形状都是完美的内心流露。',
    '您可以画一个具体的梦境、一种当下的情绪、一段记忆，或者纯粹随意宣泄色彩和笔触。',
    '完成后，给画作拍一张清晰的照片，或者导出为图片文件。'
  ];

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <PenTool className="icon-blue" size={28} />
        </div>
        <h2>步骤 1: 自由创作指南</h2>
        <p className="subtitle">放松身心，让潜意识流淌在画纸上</p>
      </div>

      <div className="card-body">
        <ul className="tips-list">
          {tips.map((tip, index) => (
            <li key={index} className="tip-item">
              <span className="tip-number">{index + 1}</span>
              <p>{tip}</p>
            </li>
          ))}
        </ul>

        <div className="art-guide-banner">
          <p>✍️ <strong>提示：</strong> 不要害怕画出不好看的画。在心理艺术中，粗糙的笔触、随意的涂鸦往往比精致的临摹包含更多真实而深刻的情感价值。</p>
        </div>
      </div>

      <div className="card-footer split-buttons">
        <button className="btn btn-secondary" onClick={onPrev}>
          返回
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          我已完成画作，去上传 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
