import { createGame } from './bootstrap/GameApp';
import { setupLauncherUI } from './ui/LauncherUI';

function initialize(): void {
  setupLauncherUI();
  const container = document.getElementById('juego');
  if (container) {
    createGame('juego');
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      createGame('juego');
    });
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
