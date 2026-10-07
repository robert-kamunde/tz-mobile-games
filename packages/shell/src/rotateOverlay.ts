import type { Translator } from '@tzg/core';
import type { Orientation } from './createShellGame';

export function orientationMismatch(required: Orientation, viewportWidth: number, viewportHeight: number): boolean {
  if (viewportWidth <= 0 || viewportHeight <= 0) return false;
  const isLandscape = viewportWidth > viewportHeight;
  return required === 'landscape' ? !isLandscape : isLandscape;
}

/**
 * Asks the player to rotate the phone when it is held the wrong way.
 * The Android build locks orientation in the manifest, so this mainly covers browser play
 * and devices that ignore the lock.
 */
export class RotateOverlay {
  private readonly el: HTMLDivElement;
  private readonly onResize = () => this.update();

  constructor(
    private readonly required: Orientation,
    private readonly translator: Translator,
    private readonly messageKey: string,
  ) {
    this.el = document.createElement('div');
    this.el.id = 'rotate-overlay';
    this.el.setAttribute('role', 'alert');
    Object.assign(this.el.style, {
      position: 'fixed',
      inset: '0',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
      background: '#101418',
      color: '#ffffff',
      font: '600 20px system-ui, sans-serif',
      zIndex: '10',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(this.el);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    this.update();
  }

  get visible(): boolean {
    return this.el.style.display !== 'none';
  }

  update(): void {
    this.el.textContent = this.translator.t(this.messageKey);
    this.el.style.display = orientationMismatch(this.required, window.innerWidth, window.innerHeight) ? 'flex' : 'none';
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.el.remove();
  }
}
