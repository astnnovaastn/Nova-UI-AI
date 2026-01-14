import React from 'react';
import './AIEyeWidget.css';

const AIEyeWidget = ({ onClose }) => {
  return (
    <div className="aieye-widget">
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>
      <div className="aieye-header">
        <h2>AI Eye</h2>
      </div>
      <div className="aieye-content">
        <p>AI vision analysis coming soon...</p>
      </div>
    </div>
  );
};

export default AIEyeWidget;
