            // Enhanced AI Vision queries - these should be processed by the AI backend
            if (lowerMessage.includes('what do you see') || lowerMessage.includes('what am i holding') ||
                lowerMessage.includes('what is this') || lowerMessage.includes('what is that') ||
                lowerMessage.includes('look at this') || lowerMessage.includes('identify this') ||
                lowerMessage.includes('recognize this') || lowerMessage.includes('describe what you see') ||
                lowerMessage.includes('tell me what this is') || lowerMessage.includes('can you see this') ||
                lowerMessage.includes('do you see this') || lowerMessage.includes('what\'s in my hand') ||
                lowerMessage.includes('what am i showing you') || lowerMessage.includes('what color is this') ||
                lowerMessage.includes('read this text') || lowerMessage.includes('what does this say') ||
                lowerMessage.includes('what\'s written here') || lowerMessage.includes('what is this object')) {
                
                showAIEyeWidget();
                addModernChatMessage("👁️ **Activating AI Vision System...**\n\n🎥 **Opening camera and analyzing in real-time...**\n\n📸 **Camera will activate automatically** - I'm ready to see what you're showing me!\n\n⚡ **Processing your request through AI backend...**", false);
                
                // Send the vision query to the AI backend for processing
                sendToNovaAI(message);
                return;
            }

            // General camera/vision widget requests (non-specific queries)
            if (lowerMessage.includes('camera') || lowerMessage.includes('vision') ||
                lowerMessage.includes('ai eye') || lowerMessage.includes('show camera') ||
                lowerMessage.includes('open camera') || lowerMessage.includes('analyze image')) {
                showAIEyeWidget();
                addModernChatMessage("👁️ **Nova AI Eye Activated!** I've opened my advanced vision system with AI eye interface. I can now see and analyze the world around you in real-time!\n\n🎯 **What I can do:**\n• Identify objects and people\n• Read text in images\n• Track movement and motion\n• Analyze scenes and environments\n• Provide detailed visual descriptions\n\n💬 **Try asking**: 'What do you see?', 'What am I holding?', or 'Track movement'", false);
                return;
            }