    def get_status(self):
        """Get voice service status"""
        if self.is_running():
            return "Voice Active"
        else:
            return "Voice Inactive"

if __name__ == "__main__":
    try:
        # Create and start voice service
        voice_service = NovaVoiceService()
        if voice_service.start():
            print("Nova Voice Service started successfully")
            print("Listening for AI responses...")
            print("Press Ctrl+C to stop")
            
            # Keep running
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nStopping voice service...")
        else:
            print("Failed to start voice service")
            
    except Exception as e:
        print(f"Error starting voice service: {e}")