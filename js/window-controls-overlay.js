(function() {
  'use strict';

  function initWindowControlsOverlay() {
    if (!('windowControlsOverlay' in navigator)) {
      return;
    }

    const header = document.querySelector('header');
    const interactiveElements = header.querySelectorAll(
      'button, input, .search-container, .mdc-icon-button'
    );
    
    interactiveElements.forEach(element => {
      element.style.webkitAppRegion = 'no-drag';
      element.style.appRegion = 'no-drag';
    });

    if (navigator.windowControlsOverlay.visible) {
      updateHeaderPadding();
      navigator.windowControlsOverlay.addEventListener(
        'geometrychange',
        debounce(updateHeaderPadding, 100)
      );
    }

    const mediaQuery = window.matchMedia('(display-mode: window-controls-overlay)');
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches && navigator.windowControlsOverlay.visible) {
        updateHeaderPadding();
      }
    });
  }

  function updateHeaderPadding() {
    if (!navigator.windowControlsOverlay || !navigator.windowControlsOverlay.visible) {
      return;
    }

    const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
    const header = document.querySelector('header');
    const windowWidth = window.innerWidth;
    
    const controlsWidth = windowWidth - rect.width - rect.x;
    const padding = Math.max(controlsWidth + 10, 140);
    
    header.style.paddingRight = padding + 'px';
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWindowControlsOverlay);
  } else {
    initWindowControlsOverlay();
  }
})();
