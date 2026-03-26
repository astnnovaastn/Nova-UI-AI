# Time Widget Documentation - splash_screen.html

## Overview
The time widget is a feature-rich component in the splash_screen.html file that displays time information with real-time updates. It features a futuristic design, location-based time display, and integrated widget controls.

## Structure

### HTML Structure
The time widget HTML element starts at line 6812 and ends at line 6830 in splash_screen.html:

```html
<!-- Time Display Widget -->
<div class="time-display widget-draggable widget-size-normal" id="timeDisplay" style="display: none;">
    <div class="corner-top-right"></div>
    <div class="corner-bottom-left"></div>
    <div class="widget-controls">
        <div class="widget-control-btn" onclick="increaseWidgetSize('timeDisplay')" title="Make Bigger">⧨</div>
        <div class="widget-control-btn" onclick="decreaseWidgetSize('timeDisplay')" title="Make Smaller">⧩</div>
        <div class="widget-control-btn" onclick="hideTimeDisplay()" title="Close">⧬</div>
    </div>
    <div class="resize-handle"></div>
    <div class="time-label" style="font-size: 1.2em; font-weight: bold; color: #2196f3; margin-bottom: 8px;">TIME</div>
    <div class="time-value" id="timeValue" style="font-size: 3em; font-weight: bold; color: #fff; margin-bottom: 8px;">--:-- --</div>
    <div class="time-location" id="timeLocation" style="font-size: 1em; color: #b0b0b0;">Local Time</div>
</div>
```

### CSS Styles
The CSS styles for the time widget are located between lines 6182 and 6278 in splash_screen.html:

- **Main container** (.time-display):
  - Position: absolute (top: 12vh, right: 6vh)
  - Background gradient with glass-morphism effect
  - Border with cyan accent color
  - Corner brackets using pseudo-elements
  - Glow animation

- **Label** (.time-label):
  - Uppercase text with blue background
  - Centered alignment

- **Time value** (.time-value):
  - Large, bold text with text shadow
  - White color with glow effect
  - Underline decoration

- **Location** (.time-location):
  - Smaller, lighter text
  - Centered alignment

- **Corner brackets** (.corner-top-right, .corner-bottom-left):
  - Angular CSS borders for futuristic look

- **Animation** (@keyframes timeGlow):
  - Pulsing glow effect for visual enhancement

### JavaScript Functions
The JavaScript functions for the time widget are primarily located between lines 7991 and 8910 in splash_screen.html:

- **showTimeDisplay(timeString, location)** (line 8911-8969):
  - Shows the time widget with specified time and location
  - Starts appropriate time updates based on location

- **updateTimeDisplay(timeString, location)** (line 8633-8675):
  - Updates the time display with smooth animations
  - Calculates time offset and triggers real-time updates

- **hideTimeDisplay()** (line 9852-9857):
  - Hides the time widget and stops updates

- **startTimeUpdates(location)** (line 8974-9002):
  - Starts time updates for the specified location

- **stopTimeUpdates()** (line 9004-9010):
  - Stops all time updates

- **parseTimeString(timeString)** (line 8677-8707):
  - Parses various time formats

- **formatTime(hours, minutes, seconds)** (line 8780-8784):
  - Formats time components into display format

- **startRealTimeUpdates(location)** (line 8714-8777):
  - Handles real-time updates with smooth transitions

- **stopRealTimeUpdates()** (line 8805-8815):
  - Stops real-time updates

- **refreshTimeFromServer(location)** (line 8785-8803):
  - Refreshes time from server periodically

- **startCountryClock(countryName)** (line 8883-8908):
  - Starts a real-time clock for a specific country

## Features

### Visual Features
1. Futuristic design with glowing borders
2. Angular corner brackets for distinctive appearance
3. Smooth animations for time updates
4. Glass-morphism effect with backdrop blur
5. Responsive sizing with widget controls

### Functional Features
1. Real-time time updates
2. Location-based time zones
3. Server synchronization for accuracy
4. Smooth animations for time transitions
5. Draggable and resizable functionality
6. Size adjustment controls
7. Close functionality

## Integration

The time widget integrates with the broader widget system in splash_screen.html:
- Uses common widget dragging and resizing functionality
- Shares the same control button styles and behaviors
- Integrates with the localStorage system for position persistence
- Uses the same styling system as other widgets (weather, search, etc.)

## Dependencies

- Widget system (dragging, resizing, controls)
- Server communication for accurate time
- Location/timezone mapping system
- Local storage for position persistence