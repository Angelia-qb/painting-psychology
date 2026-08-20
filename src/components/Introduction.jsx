import React from 'react';
import { Sparkles, Image, Heart, AlertCircle } from 'lucide-react';

export default function Introduction({ onNext }) {
  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <Sparkles className="icon-gold" size={28} />
        </div>
        <h1 className="gradient-text">自由表达绘画心理分析</h1>
        <p className="subtitle">通过表达性艺术治疗探索您的潜意识与内心世界</p>
      </div>

      <div className="card-body">
        <div className="info-grid">
          <div className="info-box">
            <div className="info-icon">
              <Image size={24} />
            </div>
            <h3>不限绘画内容</h3>
            <p>无论是纸面素描、水彩、数字插画，还是随手涂鸦、抽象线条，都可以作为探索内心世界的媒介。</p>
          </div>

          <div className="info-box">
            <div className="info-icon">
              <Heart size={24} />
            </div>
            <h3>表达性艺术治疗</h3>
            <p>本系统基于表达性艺术治疗与现象学探究理论，重视您创作时的“身体感受”与“主观联想”，而非呆板的公式化解构。</p>
          </div>
        </div>

        <div className="alert alert-warning">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <h4>💡 科学声明与免责声明</h4>
            <p>
              本系统提供的心理分析基于心理投射与艺术疗愈理论，旨在帮助您自我探索和察觉情绪，<strong>不具备任何临床诊断或医学评估效力</strong>。测试数据保存在您的本地，确保隐私安全。
            </p>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <button className="btn btn-primary" onClick={onNext}>
          开启探索之旅
        </button>
      </div>
    </div>
  );
}
