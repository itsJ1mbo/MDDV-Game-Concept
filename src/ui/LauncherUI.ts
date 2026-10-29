/**
 * LauncherUI handles interactive presentation features for the game web launcher shell:
 * - Collapsible field notes / controls guide drawer
 * - Fullscreen toggle on the game frame
 * - Hotkeys for quick UI toggle (H for controls, F for fullscreen)
 * - Auto-dimming floating HUD control pill bar
 */

export interface LauncherUIElements {
  gameFrame: HTMLElement | null;
  toggleControlsBtn: HTMLButtonElement | null;
  toggleFullscreenBtn: HTMLButtonElement | null;
  closeDrawerBtn: HTMLButtonElement | null;
  controlsDrawer: HTMLElement | null;
  drawerBackdrop: HTMLElement | null;
  hudPillBar: HTMLElement | null;
}

export function queryLauncherElements(): LauncherUIElements {
  if (typeof document === 'undefined') {
    return {
      gameFrame: null,
      toggleControlsBtn: null,
      toggleFullscreenBtn: null,
      closeDrawerBtn: null,
      controlsDrawer: null,
      drawerBackdrop: null,
      hudPillBar: null,
    };
  }

  return {
    gameFrame: document.getElementById('game-frame'),
    toggleControlsBtn: document.getElementById('btn-toggle-controls') as HTMLButtonElement | null,
    toggleFullscreenBtn: document.getElementById('btn-toggle-fullscreen') as HTMLButtonElement | null,
    closeDrawerBtn: document.getElementById('btn-close-drawer') as HTMLButtonElement | null,
    controlsDrawer: document.getElementById('controls-drawer'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    hudPillBar: document.getElementById('hud-pill-bar'),
  };
}

export function setupLauncherUI(): () => void {
  const elements = queryLauncherElements();
  const {
    gameFrame,
    toggleControlsBtn,
    toggleFullscreenBtn,
    closeDrawerBtn,
    controlsDrawer,
    drawerBackdrop,
    hudPillBar,
  } = elements;

  if (!controlsDrawer && !gameFrame) {
    return () => {};
  }

  function openDrawer(): void {
    if (!controlsDrawer) return;
    controlsDrawer.classList.add('is-open');
    controlsDrawer.setAttribute('aria-hidden', 'false');
    if (toggleControlsBtn) {
      toggleControlsBtn.setAttribute('aria-expanded', 'true');
      toggleControlsBtn.classList.add('is-active');
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.add('is-visible');
    }
  }

  function closeDrawer(): void {
    if (!controlsDrawer) return;
    controlsDrawer.classList.remove('is-open');
    controlsDrawer.setAttribute('aria-hidden', 'true');
    if (toggleControlsBtn) {
      toggleControlsBtn.setAttribute('aria-expanded', 'false');
      toggleControlsBtn.classList.remove('is-active');
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove('is-visible');
    }
  }

  function toggleDrawer(): void {
    if (!controlsDrawer) return;
    const isOpen = controlsDrawer.classList.contains('is-open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  async function toggleFullscreen(): Promise<void> {
    const target = gameFrame ?? document.documentElement;
    try {
      if (!document.fullscreenElement) {
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Browser may block fullscreen without direct gesture; silently handle
    }
  }

  function onFullscreenChange(): void {
    const isFs = Boolean(document.fullscreenElement);
    if (toggleFullscreenBtn) {
      const label = toggleFullscreenBtn.querySelector('.hud-btn-label');
      if (label) {
        label.textContent = isFs ? 'Exit Full' : 'Fullscreen';
      }
      toggleFullscreenBtn.classList.toggle('is-active', isFs);
    }
  }

  // Auto-dim HUD Pill logic
  let dimTimer: ReturnType<typeof setTimeout> | null = null;
  let isMouseOverPill = false;

  function wakePill(): void {
    if (!hudPillBar) return;
    hudPillBar.classList.remove('is-dimmed');
    if (dimTimer) {
      clearTimeout(dimTimer);
    }
    if (!isMouseOverPill) {
      dimTimer = setTimeout(() => {
        if (!isMouseOverPill && hudPillBar) {
          hudPillBar.classList.add('is-dimmed');
        }
      }, 3500);
    }
  }

  // Keyboard shortcut handler
  function onKeyDown(e: KeyboardEvent): void {
    const activeEl = document.activeElement;
    const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
    if (isInput) return;

    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      toggleDrawer();
    } else if (e.key === 'f' || e.key === 'F') {
      // Toggle fullscreen with F key
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        void toggleFullscreen();
      }
    } else if (e.key === 'Escape' && controlsDrawer?.classList.contains('is-open')) {
      e.stopPropagation();
      closeDrawer();
    }
  }

  // Attach event listeners
  toggleControlsBtn?.addEventListener('click', toggleDrawer);
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);
  toggleFullscreenBtn?.addEventListener('click', () => {
    void toggleFullscreen();
  });

  document.addEventListener('fullscreenchange', onFullscreenChange);
  window.addEventListener('keydown', onKeyDown);

  if (gameFrame && hudPillBar) {
    gameFrame.addEventListener('mousemove', wakePill);
    gameFrame.addEventListener('mouseenter', wakePill);
    hudPillBar.addEventListener('mouseenter', () => {
      isMouseOverPill = true;
      hudPillBar.classList.remove('is-dimmed');
      if (dimTimer) clearTimeout(dimTimer);
    });
    hudPillBar.addEventListener('mouseleave', () => {
      isMouseOverPill = false;
      wakePill();
    });

    // Start initial dim timer
    wakePill();
  }

  // Return cleanup teardown function
  return () => {
    if (dimTimer) clearTimeout(dimTimer);
    toggleControlsBtn?.removeEventListener('click', toggleDrawer);
    closeDrawerBtn?.removeEventListener('click', closeDrawer);
    drawerBackdrop?.removeEventListener('click', closeDrawer);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    window.removeEventListener('keydown', onKeyDown);
  };
}
