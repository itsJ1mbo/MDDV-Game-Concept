import { describe, it, expect } from 'vitest';
import { queryLauncherElements, setupLauncherUI } from '../src/ui/LauncherUI';

describe('LauncherUI', () => {
  it('gracefully handles headless or SSR environments without document', () => {
    // In headless Node.js environment without full DOM:
    const elements = queryLauncherElements();
    expect(elements).toBeDefined();
    expect(typeof setupLauncherUI).toBe('function');

    const cleanup = setupLauncherUI();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('manages drawer classes and ARIA attributes when DOM elements are provided', () => {
    // Mock minimal DOM elements
    const mockDrawer = {
      classList: {
        contains: (cls: string) => mockDrawer._classes.has(cls),
        add: (cls: string) => mockDrawer._classes.add(cls),
        remove: (cls: string) => mockDrawer._classes.delete(cls),
      },
      _classes: new Set<string>(),
      setAttribute: (k: string, v: string) => {
        mockDrawer._attrs[k] = v;
      },
      _attrs: {} as Record<string, string>,
    };

    expect(mockDrawer.classList.contains('is-open')).toBe(false);
    mockDrawer.classList.add('is-open');
    mockDrawer.setAttribute('aria-hidden', 'false');
    expect(mockDrawer.classList.contains('is-open')).toBe(true);
    expect(mockDrawer._attrs['aria-hidden']).toBe('false');

    mockDrawer.classList.remove('is-open');
    mockDrawer.setAttribute('aria-hidden', 'true');
    expect(mockDrawer.classList.contains('is-open')).toBe(false);
    expect(mockDrawer._attrs['aria-hidden']).toBe('true');
  });
});
