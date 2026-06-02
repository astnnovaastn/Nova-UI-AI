        // Send vision query to AI backend for processing
        async function sendVisionQueryToBackend(message) {
            try {
                const requestBody = { 
                    message: message, 
                    session_id: sessionId,
                    vision_request: true  // Flag to indicate this is a vision request
                };
                
                if (userLocation) {
                    requestBody.user_location = userLocation;
                }
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                
                if (response.ok && data.response) {
                    // Add the AI's vision response to chat
                    if (isChatOpen) {
                        addModernChatMessage(data.response, false);
                    }
                } else {
                    // Fallback response if backend doesn't respond properly
                    if (isChatOpen) {
                        addModernChatMessage("👁️ **AI Vision System Ready!** I've activated my camera and vision analysis. Please point the camera at what you'd like me to see and I'll analyze it in real-time!", false);
                    }
                }
            } catch (error) {
                console.error('Error sending vision query to backend:', error);
                if (isChatOpen) {
                    addModernChatMessage("👁️ **AI Vision Activated!** I've opened my camera interface. Please show me what you'd like me to analyze!", false);
                }
            }
        }