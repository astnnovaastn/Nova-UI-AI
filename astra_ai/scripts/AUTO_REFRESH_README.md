# Auto-Refresh Functionality

The Nova AI Desktop Interface now includes automatic refresh functionality that allows you to see changes to your code in real-time without restarting the application.

## Features

### 🔄 Auto-Refresh
- **UI Files**: Changes to HTML, CSS, and JavaScript files automatically refresh the interface
- **Python Files**: Changes to Nova AI core files automatically reload the AI module
- **Smart Detection**: Only watches relevant files and ignores temporary files

### 📁 Watched Directories
- `core/` - Nova AI core files (Python)
- `ui/` - User interface files (HTML, CSS, JS)
- `scripts/` - Desktop launcher files (Python)

### 🚫 Ignored Files
- `__pycache__/` directories
- `.git/` directories
- `.vscode/` directories
- `*.pyc`, `*.pyo` files
- `*.log` files
- `.DS_Store`, `Thumbs.db` files

## How to Use

### 1. Start the Desktop Interface
```bash
cd astra_ai/scripts
python run_desktop_nova.py
```

### 2. Make Changes
Simply edit any of the watched files:
- Modify `astra_ai/ui/splash_screen.html` for UI changes
- Modify `astra_ai/core/nova_ai.py` for AI behavior changes
- Add new CSS or JavaScript files in the `ui/` directory

### 3. See Changes Instantly
The interface will automatically refresh when you save changes to watched files.

## Testing Auto-Refresh

### Manual Test
1. Start the desktop interface
2. Open `astra_ai/ui/splash_screen.html` in your editor
3. Make a small change (e.g., change a color or text)
4. Save the file
5. Watch the interface refresh automatically

### Automated Test
Run the test script to verify auto-refresh is working:
```bash
cd astra_ai/scripts
python test_auto_refresh.py
```

## API Endpoints

### Manual Refresh
```bash
curl -X POST http://localhost:[API_PORT]/api/refresh
```

### System Status
```bash
curl http://localhost:[API_PORT]/api/status
```

## Troubleshooting

### Auto-Refresh Not Working
1. **Check Dependencies**: Make sure `watchdog` is installed
   ```bash
   pip install watchdog
   ```

2. **Check Console Output**: Look for file watcher messages in the console
   - Should see: "👁️ Watching: [path]"
   - Should see: "🔍 File watcher started - auto-refresh enabled"

3. **Check File Permissions**: Ensure the script has read access to watched directories

4. **Manual Refresh**: Use the API endpoint to test manual refresh
   ```bash
   curl -X POST http://localhost:[API_PORT]/api/refresh
   ```

### Nova AI Not Reloading
1. **Check File Path**: Make sure you're editing files in the `core/` directory
2. **Check Console**: Look for "Nova AI reloaded successfully" message
3. **Restart if Needed**: Some changes may require a full restart

### Performance Issues
- **Reduce Refresh Frequency**: Increase `refresh_cooldown` in the code (default: 1 second)
- **Exclude Files**: Add patterns to `ignore_patterns` in `CodeChangeHandler`

## Configuration

### Adjust Refresh Cooldown
Edit `refresh_cooldown` in `run_desktop_nova.py`:
```python
refresh_cooldown = 1  # Seconds between refreshes
```

### Add/Remove Watched Directories
Edit `paths_to_watch` in `setup_file_watcher()`:
```python
paths_to_watch = [
    current_dir / 'core',    # Nova AI core files
    current_dir / 'ui',      # UI files
    current_dir / 'scripts'  # Desktop launcher files
    # Add more directories here
]
```

### Customize Ignored Patterns
Edit `ignore_patterns` in `CodeChangeHandler`:
```python
self.ignore_patterns = {
    '__pycache__',
    '.git',
    '.vscode',
    'node_modules',
    # Add more patterns here
}
```

## Console Messages

### Success Messages
- `✅ UI refreshed using reload()`
- `✅ Nova AI reloaded successfully`
- `👁️ Watching: [path]`

### Warning Messages
- `⚠️ Skipping refresh (cooldown active)`
- `⚠️ Failed to reload Nova AI`
- `⚠️ Cannot refresh: No webview windows available`

### Error Messages
- `❌ watchdog library not found`
- `❌ Failed to setup file watcher`

## Best Practices

1. **Save Files**: Always save files after making changes
2. **Check Console**: Monitor console output for refresh messages
3. **Test Incrementally**: Make small changes and test frequently
4. **Backup Changes**: Keep backups of important changes
5. **Restart if Needed**: Some complex changes may require a full restart

## Limitations

- **Module Dependencies**: Some Python module changes may require a full restart
- **Global Variables**: Changes to global variables may not persist across reloads
- **File System**: Some file systems may have limitations with file watching
- **Performance**: Very frequent changes may impact performance

## Support

If you encounter issues with auto-refresh:
1. Check the console output for error messages
2. Try the manual refresh endpoint
3. Restart the application if needed
4. Check file permissions and dependencies 