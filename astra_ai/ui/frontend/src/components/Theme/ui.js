function styledConfirm(message, options = {}) {
  const prefix = options?.danger ? 'Warning: ' : '';
  return Promise.resolve(window.confirm(`${prefix}${message}`));
}

function showToast(message) {
  try {
    window.dispatchEvent(new CustomEvent('theme-toast', { detail: { message } }));
  } catch {
    // Ignore event dispatch issues.
  }
  console.info('[theme]', message);
}

const uiModule = {
  styledConfirm,
  showToast,
};

export default uiModule;
