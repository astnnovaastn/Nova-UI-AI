export function snapModalToZone(element, options = {}) {
  if (!element) return;
  const margin = options.margin ?? 16;
  const rect = element.getBoundingClientRect();
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
  const left = Math.min(maxLeft, Math.max(margin, rect.left));
  const top = Math.min(maxTop, Math.max(margin, rect.top));
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}
