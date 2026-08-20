import React, { useState } from 'react';
import { HelpCircle, Loader2, ArrowRight } from 'lucide-react';

export default function GuidedInquiry({ answers, setAnswers, onSubmit, onPrev, isSubmitting }) {
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({
      ...prev,
      [name]: value
    }));
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!answers.drawingTitle?.trim()) {
      newErrors.drawingTitle = '请给您的画起一个名字';
    }
    if (!answers.description?.trim()) {
      newErrors.description = '请简要描述一下画面里有什么';
    }
    if (!answers.emotions?.trim()) {
      newErrors.emotions = '请描述一下您创作时或看着它时的感受';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  const fields = [
    {
      name: 'drawingTitle',
      label: '1. 作品命名',
      placeholder: '例如：《雨中的等待》、《解脱》、《无题》...',
      description: '如果给这幅画一个标题，它叫什么？',
      type: 'input'
    },
    {
      name: 'description',
      label: '2. 画面描述',
      placeholder: '例如：画面中心是一个深蓝色的圆圈，被许多放射状的红色线条包围，右上角有一颗微弱发光的星星...',
      description: '假想一个完全不认识你的人看着这幅画，描述一下他会在画面里看到什么元素？',
      type: 'textarea'
    },
    {
      name: 'emotions',
      label: '3. 情绪与身体感觉',
      placeholder: '例如：画红色线条时手腕很用力，呼吸有点急促；现在看着它，感觉胸口有些闷，但整体是一种平静宣泄后的释怀...',
      description: '在画这幅画时，你的身体有什么感觉？画完后看着它，内心有什么情绪涌现？',
      type: 'textarea'
    },
    {
      name: 'dialogue',
      label: '4. 画面对话 (选填)',
      placeholder: '例如：那个深蓝色的圆圈会对我说：“不要害怕，我在这里保护你。”...',
      description: '如果这幅画中的某个颜色、线条或形状能够开口说话，它会对你诉说什么？',
      type: 'textarea'
    },
    {
      name: 'backgroundContext',
      label: '5. 创作背景 (选填)',
      placeholder: '例如：今天刚加完班，感到非常疲惫和空虚，于是顺手拿笔在本子上涂鸦了这幅画...',
      description: '你是在什么契机、什么环境下创作这幅画的？',
      type: 'textarea'
    }
  ];

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <HelpCircle className="icon-blue" size={28} />
        </div>
        <h2>步骤 3: 表达性探索问卷</h2>
        <p className="subtitle">通过与画作的对话，挖掘潜意识信息</p>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="card-body scrollable-body">
          {fields.map((field) => (
            <div key={field.name} className="form-group">
              <label htmlFor={field.name} className="form-label">
                {field.label}
              </label>
              <p className="field-desc">{field.description}</p>
              
              {field.type === 'input' ? (
                <input
                  type="text"
                  id={field.name}
                  name={field.name}
                  value={answers[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`form-input ${errors[field.name] ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
              ) : (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={answers[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`form-textarea ${errors[field.name] ? 'input-error' : ''}`}
                  rows={3}
                  disabled={isSubmitting}
                />
              )}
              {errors[field.name] && <span className="error-text">{errors[field.name]}</span>}
            </div>
          ))}
        </div>

        <div className="card-footer split-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrev}
            disabled={isSubmitting}
          >
            返回
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                正在保存数据...
              </>
            ) : (
              <>
                提交分析数据 <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
