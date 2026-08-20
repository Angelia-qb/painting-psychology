import React from 'react';
import { BookOpen, FileText, CheckCircle, ShieldAlert, Award } from 'lucide-react';

export default function Appendix() {
  const sections = [
    {
      title: '一、 经典投射技术与历史源流',
      icon: <Award size={20} className="icon-blue" />,
      content: (
        <>
          <p>
            绘画心理分析（Projective Drawings）起源于20世纪早期的<strong>投射假说（Projective Hypothesis）</strong>。
            该理论认为，人在面对模糊、无固定结构的刺激（如白纸）时，倾向于无意识地将自己内心深处的焦虑、防御、冲突与人格特质“投射”于外部媒介中。
          </p>
          <div className="appendix-sub-item">
            <strong>1. 从智力测量到人格探索（Florence Goodenough, 1926 & Karen Machover, 1949）</strong>
            <p>
              最初，Goodenough 发明“画人测验（DAP）”是为了测量儿童的认知智力水平。
              其后，精神分析学家 Machover 发现画作中的异常比例、缺失与细节能够折射出创伤与身体意象（Body Image），从而将该方法推广为一种投射性人格评估手段。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>2. 房树人测试的延伸（John Buck, 1948）</strong>
            <p>
              John Buck 将绘画范围扩大为房子（代表家庭关系与安全环境）、树（代表潜意识自我与活力状态）、人（代表社会自我与身体投射），构建了 HTP 测验。
            </p>
          </div>
        </>
      )
    },
    {
      title: '二、 现代心理学的科学批判与局限性',
      icon: <ShieldAlert size={20} className="icon-gold" />,
      content: (
        <>
          <p>
            进入20世纪末，随着实证心理学与心理测量学的发展，投射测验的<strong>信度与效度</strong>受到了学术界的严厉审视与批判。
          </p>
          <div className="appendix-sub-item">
            <strong>1. 缺乏实证支持与单一特征谬误（Lilienfeld et al., 2000）</strong>
            <p>
              著名临床心理学家 Scott Lilienfeld 及其团队在学术评估中指出，<strong>大多数投射绘画的评分指标缺乏足够的经验证据</strong>。
              例如，传统理论中“画黑云代表焦虑”、“不画耳朵代表偏执”等公式化的“单一符号解读”，在受控对照实验中被证实**无法可靠地预测或诊断任何心理病理状态**。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>2. 极易受无关变量干扰</strong>
            <p>
              研究表明，个体的绘画熟练度、空间协调能力、测试当下的疲劳感、画笔和纸张材质，甚至创作者的文化背景，都会极大地影响画作呈现。如果直接用固定公式解构，极易产生“假阳性”诊断，导致错误的心理学判断。
            </p>
          </div>
        </>
      )
    },
    {
      title: '三、 现象学与表达性艺术治疗的科学复归',
      icon: <BookOpen size={20} className="icon-green" />,
      content: (
        <>
          <p>
            为了克服“生搬硬套符号”的伪科学倾向，现代心理咨询和治疗逐渐向<strong>现象学艺术治疗（Phenomenological Art Therapy）</strong>与<strong>表达性艺术治疗（Expressive Art Therapy）</strong>过渡。
          </p>
          <div className="appendix-sub-item">
            <strong>1. 去阐释化与“倾听画像”（Mala Betensky, 1995）</strong>
            <p>
              现象学取向主张咨询师必须<strong>“悬置（Bracket）”自己的主观偏见</strong>。咨询师不再假定自己是看懂画作的“专家”，而是引导创作者去观察、描述自己的画作，探究作画过程中的<strong>身体感受、情绪变化</strong>。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>2. 画后询问（PDI）的核心价值</strong>
            <p>
              只有当画作与创作者的自我叙事（即画后询问问卷的回答）相结合时，画作才真正拥有心理学意义。本系统采用的5个开放式问题，正是源于表达性艺术治疗的“对话意象法”，旨在让创作者成为自己内心的解说者。
            </p>
          </div>
        </>
      )
    },
    {
      title: '四、 核心学术参考文献 (References)',
      icon: <FileText size={20} className="icon-blue" />,
      content: (
        <ul className="ref-list">
          <li>
            <strong>Lilienfeld, S. O., Wood, J. M., & Garb, H. N. (2000).</strong> The scientific status of projective techniques. <i>Psychological Science in the Public Interest</i>, 1(2), 27-66. 
            <span className="ref-desc">（全面梳理和批判了包括画人测验在内的投射测试，确立了现代实证评估标准）</span>
          </li>
          <li>
            <strong>Betensky, M. (1995).</strong> <i>What do you see? Phenomenological approach to art therapy.</i> Jessica Kingsley Publishers.
            <span className="ref-desc">（现象学艺术治疗的奠基之作，主张通过引导来访者观察和描述画面，代替咨询师的主观解构）</span>
          </li>
          <li>
            <strong>Machover, K. (1949).</strong> <i>Personality projection in the drawing of the human figure: A method of personality investigation.</i> Charles C Thomas.
            <span className="ref-desc">（经典投射人体绘图理论源头）</span>
          </li>
          <li>
            <strong>Buck, J. N. (1948).</strong> The H-T-P technique: A qualitative and quantitative scoring manual. <i>Journal of Clinical Psychology</i>, Monograph Supplement, 4, 1-120.
            <span className="ref-desc">（房树人测验的起源手册）</span>
          </li>
          <li>
            <strong>Garb, H. N., Wood, J. M., Lilienfeld, S. O., & Nezworski, M. T. (2002).</strong> Effective use of projective techniques in clinical practice: Let's look at the data. <i>Professional Psychology: Research and Practice</i>, 33(5), 454-463.
            <span className="ref-desc">（评估了投射法在实际临床操作中的信效度边界）</span>
          </li>
          <li>
            <strong>Motta, R. W., Little, S. G., & Burns, T. F. (1993).</strong> Human figure drawings: The validity of clinical interpretations. <i>School Psychology Quarterly</i>, 8(2), 105-113.
            <span className="ref-desc">（验证了特定绘图符号特征在诊断心理病理时的无效性）</span>
          </li>
        </ul>
      )
    }
  ];

  return (
    <div className="card animate-fade-in text-left">
      <div className="card-header text-center-header">
        <div className="icon-badge">
          <BookOpen className="icon-blue" size={28} />
        </div>
        <h2 className="gradient-text">绘画心理分析科学附录</h2>
        <p className="subtitle">了解绘画分析的科学事实、发展局限与治疗学依据</p>
      </div>

      <div className="card-body scrollable-body">
        <div className="appendix-container">
          {sections.map((section, idx) => (
            <div key={idx} className="appendix-section-box">
              <h3 className="appendix-section-title">
                {section.icon}
                {section.title}
              </h3>
              <div className="appendix-section-content">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
