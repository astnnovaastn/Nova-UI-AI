import React, { useState, useRef, useEffect } from 'react';
import './CameraWidget.css';

const CameraWidget = ({ onClose }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [filter, setFilter] = useState('none');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      console.log('Photo captured:', imageData.substring(0, 50) + '...');
    }
  };

  const analyzeWithAI = async () => {
    if (!canvasRef.current) return;
    setAiAnalyzing(true);
    setAnalyzing(true);
    
    try {
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      // Send to Gemini API if configured
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (geminiKey) {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'What do you see in this image? Identify objects, describe the scene briefly.' },
                { inline_data: { mime_type: 'image/jpeg', data: imageData.split(',')[1] } }
              ]
            }]
          })
        });
        const data = await response.json();
        console.log('AI Analysis:', data);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAiAnalyzing(false), 1000);
    }
  };

  const applyFilter = (filterType) => {
    setFilter(filterType);
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const data = imageData.data;

      if (filterType === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
      } else if (filterType === 'edge') {
        // Simple edge detection
        const tempImageData = ctx.createImageData(imageData);
        for (let i = 0; i < data.length; i += 4) {
          tempImageData.data[i] = 255 - data[i];
          tempImageData.data[i + 1] = 255 - data[i + 1];
          tempImageData.data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(tempImageData, 0, 0);
        return;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  };

  return (
    <div className="camera-widget">
      <div className="camera-header">
        <div className="camera-logo">
          <i className="fas fa-camera"></i>
        </div>
        <div>
          <h3 className="camera-title">Camera</h3>
          <p className="camera-brand">Real-time Analysis</p>
        </div>
        <div className="camera-status">
          <div className={`status-indicator ${cameraActive ? 'active' : ''}`}></div>
        </div>
      </div>

      <div className="camera-content">
        <div className="camera-viewport">
          {cameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="camera-placeholder">
              <i className="fas fa-camera"></i>
              <p>Camera Offline</p>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            style={{ display: 'none' }} 
            width="640" 
            height="480"
          />
        </div>

        <div className="camera-controls">
          <button 
            className="control-btn" 
            onClick={cameraActive ? stopCamera : startCamera}
          >
            <i className={`fas fa-${cameraActive ? 'stop' : 'play'}`}></i>
            {cameraActive ? 'Stop' : 'Start'}
          </button>
          <button className="control-btn capture" onClick={capturePhoto} disabled={!cameraActive}>
            <i className="fas fa-camera"></i>
          </button>
          <button 
            className={`control-btn ai-btn ${aiAnalyzing ? 'active' : ''}`} 
            onClick={analyzeWithAI}
            disabled={!cameraActive || analyzing}
          >
            <i className="fas fa-brain"></i>
          </button>
        </div>

        <div className="filters-panel">
          <button 
            className={`filter-btn ${filter === 'none' ? 'active' : ''}`}
            onClick={() => applyFilter('none')}
          >
            Normal
          </button>
          <button 
            className={`filter-btn ${filter === 'grayscale' ? 'active' : ''}`}
            onClick={() => applyFilter('grayscale')}
          >
            B&W
          </button>
          <button 
            className={`filter-btn ${filter === 'edge' ? 'active' : ''}`}
            onClick={() => applyFilter('edge')}
          >
            Edge
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraWidget;
