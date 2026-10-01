export function makeWindowDraggable(element, options = {}) {
  if (!element) return () => {};
  const handle = options.handle || element;
  if (!handle) return () => {};

  let active = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseMove = (event) => {
    if (!active) return;
    const left = Math.max(0, event.clientX - offsetX);
    const top = Math.max(0, event.clientY - offsetY);
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  };

  const onMouseUp = () => {
    active = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseDown = (event) => {
    if (event.target.closest('button, input, select, textarea, label, a')) return;
    const rect = element.getBoundingClientRect();
    active = true;
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  handle.addEventListener('mousedown', onMouseDown);

  return () => {
    handle.removeEventListener('mousedown', onMouseDown);
    onMouseUp();
  };
}
