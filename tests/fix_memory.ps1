# PowerShell script to fix the memory system logic
$filePath = "C:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\memory\mem0_memory_system.py"

# Read the entire file content
$content = Get-Content -Path $filePath -Raw

# Define the exact original block (with proper indentation and line breaks)
$originalBlock = "            # Determine update type based on semantic analysis`r`n            previous_value = str(similar_event.get('current_value', similar_event.get('summary', '')))`r`n            update_type = self._determine_update_type(previous_value, operation_content)`r`n`r`n            # Create timestamp`r`n            timestamp = datetime.now().isoformat()`r`n            event_id = f`"evt_{uuid.uuid4().hex[:8]}`"`r`n`r`n            # Update the operation to be an UPDATE event`r`n            update_event = {`r`n                `"