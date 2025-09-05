export function enforceSingleReferenceLimit(fieldName) {
  const observer = new MutationObserver(() => {
    const fieldWrapper = document.querySelector(`[data-field-name="${fieldName}"]`);
    if (!fieldWrapper) return;

    const addButton = fieldWrapper.querySelector('button[aria-label="Add"]');
    const items = fieldWrapper.querySelectorAll('.reference-list-item, .reference-item');

    if (addButton) {
      if (items.length >= 1) {
        addButton.disabled = true;
      } else {
        addButton.disabled = false;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function isAuthoring() {
  return window.location.hostname.includes('author');
}
