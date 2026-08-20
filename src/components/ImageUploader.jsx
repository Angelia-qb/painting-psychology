import React, { useRef, useState } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';

export default function ImageUploader({ drawing, setDrawing, onNext, onPrev }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('只允许上传图片文件（JPG, PNG, WebP等）');
      return;
    }

    // Validate size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      return;
    }

    setError('');
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setDrawing({
        file: file,
        previewUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const clearSelection = () => {
    setDrawing(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <Upload className="icon-blue" size={28} />
        </div>
        <h2>步骤 2: 上传您的画作</h2>
        <p className="subtitle">拖拽或选择本地图片进行上传</p>
      </div>

      <div className="card-body">
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!drawing ? (
          <div
            className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div className="upload-prompt">
              <div className="upload-icon-circle">
                <Upload size={32} />
              </div>
              <p className="upload-main-text">点击选择 或 拖拽图片到这里</p>
              <p className="upload-sub-text">支持 PNG, JPG, JPEG, WEBP 格式（最大 10MB）</p>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-card">
              <img src={drawing.previewUrl} alt="Uploaded drawing" className="drawing-preview" />
              <button className="btn-delete" onClick={clearSelection} title="移除图片">
                <X size={18} />
              </button>
            </div>
            <div className="file-info">
              <FileImage size={18} className="file-info-icon" />
              <span className="file-name">{drawing.file.name}</span>
              <span className="file-size">({(drawing.file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          </div>
        )}
      </div>

      <div className="card-footer split-buttons">
        <button className="btn btn-secondary" onClick={onPrev}>
          返回
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!drawing}
        >
          继续，填写现象学问卷
        </button>
      </div>
    </div>
  );
}
