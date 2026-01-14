import React from 'react';
import './ObjectIdentificationWidget.css';

const ObjectIdentificationWidget = ({ onClose }) => {
  return (
    <div className="object-identification-widget">
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>
      <div className="object-header">
        <h2>Object Identification</h2>
      </div>
      <div className="object-content">
        <p>Object and image recognition coming soon...</p>
      </div>
    </div>
  );
};

export default ObjectIdentificationWidget;
