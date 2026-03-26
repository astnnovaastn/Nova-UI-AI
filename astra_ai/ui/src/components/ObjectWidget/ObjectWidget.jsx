import React, { useState } from 'react';
import { useWidgetDraggable, useWidgetResizable, useWidgetPersistence, useWidgetAI } from '../hooks/useWidgetHooks';
import '../styles/ObjectWidget.css';

const ObjectIdentificationWidget = () => {
  const widgetId = 'object-widget';
  const draggable = useWidgetDraggable(widgetId);
  const resizable = useWidgetResizable(widgetId, { width: 450, height: 550 });
  const { data: objectData, updateData } = useWidgetPersistence(widgetId, {
    identifiedObjects: [],
    analysisHistory: [],
  });
  const { callGemini, loading: aiLoading } = useWidgetAI();

  const [uploadedImage, setUploadedImage] = useState(null);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [identifiedObjects, setIdentifiedObjects] = useState(objectData.identifiedObjects || []);
  const [analysisHistory, setAnalysisHistory] = useState(objectData.analysisHistory || []);
  const [activeTab, setActiveTab] = useState('identify');
  const [stage, setStage] = useState('upload'); // upload, identifying, identified, analyzing, analyzed

  // Stage 1: Quick identification
  const identifyObject = async (imageBase64) => {
    setStage('identifying');
    const prompt = `Identify the main object(s) in this image briefly:

- Object name/type (specific if possible)
- Primary color
- Category
- Confidence level (low/medium/high)

Keep it to 2-3 sentences, be direct.`;

    const result = await callGemini(prompt, imageBase64);
    if (result.success) {
      setIdentificationResult({
        content: result.content,
        timestamp: new Date().toLocaleTimeString(),
        image: uploadedImage,
      });
      setStage('identified');
    }
  };

  // Stage 2: Detailed analysis
  const performDetailedAnalysis = async () => {
    setStage('analyzing');
    const prompt = `Based on this object identification: "${identificationResult.content}"

Provide COMPREHENSIVE information:

1. **Product Details:**
   - Full name and brand
   - Model/variant
   - Key specifications

2. **Pricing & Availability:**
   - Typical price range
   - Where to buy
   - Current market status

3. **Usage & Features:**
   - Main uses
   - Key features (top 5)
   - Benefits

4. **Reviews & Ratings:**
   - Average rating
   - Common feedback
   - Pros and cons

5. **Alternatives:**
   - Similar products
   - Competitor comparison
   - Recommendations

6. **Additional Info:**
   - Warranty/Support
   - Trending/Popular
   - Special notes`;

    const result = await callGemini(prompt, uploadedImage);
    if (result.success) {
      setDetailedAnalysis({
        content: result.content,
        timestamp: new Date().toLocaleTimeString(),
        objectName: identificationResult.content.split('\n')[0],
      });

      // Save to history
      const historyItem = {
        id: Date.now(),
        objectName: identificationResult.content.split('\n')[0],
        quickId: identificationResult.content,
        detailedAnalysis: result.content,
        timestamp: new Date().toLocaleString(),
        image: uploadedImage,
      };
      const newObjects = [historyItem, ...identifiedObjects];
      setIdentifiedObjects(newObjects);
      updateData((prev) => ({ ...prev, identifiedObjects: newObjects }));

      setStage('analyzed');
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageBase64 = event.target.result.split(',')[1];
        setUploadedImage(imageBase64);
        setStage('upload');
        identifyObject(imageBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compare objects
  const compareObjects = async (obj1, obj2) => {
    const prompt = `Compare these two objects:

Object 1: "${obj1.objectName}"
Details: "${obj1.quickId}"

Object 2: "${obj2.objectName}"
Details: "${obj2.quickId}"

Provide:
1. Similarities
2. Differences
3. Which is better and why
4. Use cases for each
5. Overall comparison score`;

    const result = await callGemini(prompt);
    if (result.success) {
      alert('Comparison Analysis:\n\n' + result.content);
    }
  };

  // Reset for new identification
  const resetIdentification = () => {
    setUploadedImage(null);
    setIdentificationResult(null);
    setDetailedAnalysis(null);
    setStage('upload');
  };

  return (
    <div
      {...draggable}
      ref={draggable.ref}
      {...resizable}
      className="widget-container object-widget"
      style={{
        ...draggable.style,
        ...resizable.style,
        position: 'fixed',
        zIndex: 1000,
        backgroundColor: '#0a0e27',
        border: '2px solid #ffaa00',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(255, 170, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="widget-header" style={{ borderBottom: '2px solid #ffaa00', padding: '12px' }}>
        <div className="widget-title" style={{ color: '#ffaa00', fontSize: '16px', fontWeight: 'bold' }}>
          🔎 OBJECT IDENTIFIER
        </div>
        <div className="widget-status" style={{ fontSize: '11px', color: '#ff8800' }}>
          ● TWO-STAGE AI ANALYSIS
        </div>
      </div>

      {/* Tabs */}
      <div className="object-tabs" style={{ display: 'flex', borderBottom: '1px solid #ffaa00', gap: '8px', padding: '8px' }}>
        {['identify', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#ffaa00' : 'transparent',
              color: activeTab === tab ? '#0a0e27' : '#ffaa00',
              border: '1px solid #ffaa00',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div
        className="object-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          color: '#ffaa00',
          fontSize: '12px',
        }}
      >
        {activeTab === 'identify' && (
          <div className="identification-section">
            {/* Upload Section */}
            {stage === 'upload' && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div
                    style={{
                      padding: '30px',
                      border: '2px dashed #ffaa00',
                      borderRadius: '8px',
                      color: '#ffaa00',
                      fontSize: '14px',
                    }}
                  >
                    📷 Click to upload image
                  </div>
                </label>
              </div>
            )}

            {/* Identifying Stage */}
            {(stage === 'identifying' || stage === 'identified' || stage === 'analyzing' || stage === 'analyzed') && (
              <div>
                {uploadedImage && (
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <img
                      src={`data:image/jpeg;base64,${uploadedImage}`}
                      alt="Uploaded"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '150px',
                        borderRadius: '4px',
                        border: '1px solid #ffaa00',
                      }}
                    />
                  </div>
                )}

                {/* Quick Identification Results */}
                {identificationResult && (
                  <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#1a1f3a', borderRadius: '4px', borderLeft: '3px solid #ffaa00' }}>
                    <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '6px' }}>
                      ⚡ QUICK IDENTIFICATION:
                    </div>
                    <div style={{ color: '#cccccc', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                      {identificationResult.content}
                    </div>
                    <div style={{ fontSize: '10px', color: '#ff8800', marginTop: '6px' }}>
                      {identificationResult.timestamp}
                    </div>
                  </div>
                )}

                {/* Detailed Analysis Results */}
                {detailedAnalysis && (
                  <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#1a1f3a', borderRadius: '4px', borderLeft: '3px solid #00ff88' }}>
                    <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '6px' }}>
                      📊 DETAILED ANALYSIS:
                    </div>
                    <div style={{ color: '#cccccc', fontSize: '10px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                      {detailedAnalysis.content}
                    </div>
                    <div style={{ fontSize: '10px', color: '#ff8800', marginTop: '6px' }}>
                      {detailedAnalysis.timestamp}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexDirection: 'column' }}>
                  {stage === 'identified' && (
                    <button
                      onClick={performDetailedAnalysis}
                      disabled={aiLoading}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: aiLoading ? '#ffaa0066' : '#ffaa00',
                        color: '#0a0e27',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: aiLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {aiLoading ? 'Analyzing...' : 'Get Detailed Analysis'}
                    </button>
                  )}
                  {(stage === 'identified' || stage === 'analyzed') && (
                    <button
                      onClick={resetIdentification}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'transparent',
                        color: '#ffaa00',
                        border: '1px solid #ffaa00',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      📷 Identify New Object
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            {identifiedObjects.length === 0 ? (
              <div style={{ color: '#ff8800', textAlign: 'center', padding: '20px' }}>
                No identified objects yet. Upload an image to get started!
              </div>
            ) : (
              identifiedObjects.map((obj, idx) => (
                <div key={obj.id} style={{ marginBottom: '12px', borderBottom: '1px solid #ffaa0033', paddingBottom: '10px' }}>
                  <div style={{ color: '#ffff00', fontWeight: 'bold', fontSize: '12px' }}>
                    {obj.objectName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#ff8800', margin: '4px 0' }}>
                    {obj.timestamp}
                  </div>
                  {obj.image && (
                    <img
                      src={`data:image/jpeg;base64,${obj.image}`}
                      alt={obj.objectName}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '80px',
                        borderRadius: '3px',
                        margin: '6px 0',
                        border: '1px solid #ffaa00',
                      }}
                    />
                  )}
                  <details style={{ marginTop: '6px' }}>
                    <summary style={{ cursor: 'pointer', color: '#00ff88', fontSize: '11px', fontWeight: 'bold' }}>
                      View Analysis
                    </summary>
                    <div style={{ fontSize: '10px', color: '#cccccc', marginTop: '6px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                      {obj.detailedAnalysis}
                    </div>
                  </details>
                  {idx < identifiedObjects.length - 1 && (
                    <button
                      onClick={() => compareObjects(obj, identifiedObjects[idx + 1])}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        backgroundColor: '#ffaa0033',
                        border: '1px solid #ffaa00',
                        color: '#ffaa00',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        marginTop: '6px',
                      }}
                    >
                      Compare with next
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={resizable.onResizeStart}
        style={{
          width: '20px',
          height: '20px',
          position: 'absolute',
          bottom: '0',
          right: '0',
          cursor: 'nwse-resize',
          background: 'linear-gradient(135deg, transparent 50%, #ffaa00 50%)',
          borderRadius: '0 0 8px 0',
        }}
      />
    </div>
  );
};

export default ObjectIdentificationWidget;
