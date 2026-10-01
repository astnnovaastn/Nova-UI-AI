function markAttached(input) {
  input.dataset.colorPickerAttached = '1';
}

export function attachColorPicker(input) {
  if (!input || input.dataset.colorPickerAttached === '1') return input;
  markAttached(input);
  return input;
}

export function initColorPickers(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('input[type="color"]').forEach((input) => attachColorPicker(input));
}
