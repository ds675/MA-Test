import { Component } from '@theme/component';

/**
 * @typedef {Object} SideDrawerRefs
 * @property {HTMLElement} overlay
 * @property {HTMLElement} drawer
 * @property {HTMLElement} panelsContainer
 * @property {HTMLButtonElement} closeBtn
 */

/** @extends {Component<SideDrawerRefs>} */
class SideDrawerComponent extends Component {
  /** @type {string[]} */
  #panelStack = [];

  /** @type {Map<string, number>} */
  #scrollPositions = new Map();

  /** @type {HTMLElement|null} */
  #triggerElement = null;

  /** @type {string} */
  #originalHeaderHTML = '';

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('side-drawer:open', this.#handleExternalOpen.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('side-drawer:open', this.#handleExternalOpen.bind(this));
  }

  #handleExternalOpen() {
    this.#triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.open();
  }

  /* ---- Public API ---- */

  open() {
    if (this.refs.overlay) {
      this.refs.overlay.setAttribute('data-active', '');
    }

    if (this.refs.drawer) {
      this.refs.drawer.setAttribute('data-active', '');
    }

    document.body.style.overflow = 'hidden';
    this.#panelStack = ['l1'];
    this.#showPanel('l1');

    if (this.refs.closeBtn) {
      this.refs.closeBtn.focus();
    }
  }

  close() {
    if (this.refs.overlay) {
      this.refs.overlay.removeAttribute('data-active');
    }

    if (this.refs.drawer) {
      this.refs.drawer.removeAttribute('data-active');
    }

    document.body.style.overflow = '';
    this.#panelStack = [];
    this.#scrollPositions.clear();

    if (this.#triggerElement) {
      this.#triggerElement.focus();
      this.#triggerElement = null;
    }
  }

  /* ---- Panel Navigation ---- */

  handleNavigateToPanel(event) {
    const button = event.currentTarget;
    const panelId = button.getAttribute('data-panel-target');

    if (!panelId) return;

    const currentPanelId = this.#panelStack[this.#panelStack.length - 1];

    if (currentPanelId) {
      const currentPanel = this.querySelector(`[data-panel-id="${currentPanelId}"]`);

      if (currentPanel) {
        this.#scrollPositions.set(currentPanelId, currentPanel.scrollTop);
      }
    }

    this.#panelStack.push(panelId);
    this.#showPanel(panelId);
    this.#updateHeader();
  }

  handleNavigateBack() {
    if (this.#panelStack.length <= 1) return;

    const leavingPanelId = this.#panelStack.pop();
    const targetPanelId = this.#panelStack[this.#panelStack.length - 1];

    if (leavingPanelId) {
      const leavingPanel = this.querySelector(`[data-panel-id="${leavingPanelId}"]`);

      if (leavingPanel) {
        leavingPanel.removeAttribute('data-active');
      }
    }

    if (targetPanelId) {
      this.#showPanel(targetPanelId);
      const restoredScroll = this.#scrollPositions.get(targetPanelId) || 0;
      const panel = this.querySelector(`[data-panel-id="${targetPanelId}"]`);

      if (panel) {
        panel.scrollTop = restoredScroll;
      }
    }

    this.#updateHeader();
  }

  #showPanel(panelId) {
    const panels = this.querySelectorAll('[data-panel-id]');

    for (const panel of panels) {
      if (panel.getAttribute('data-panel-id') === panelId) {
        panel.setAttribute('data-active', '');
      } else if (!this.#panelStack.includes(panel.getAttribute('data-panel-id') || '')) {
        panel.removeAttribute('data-active');
      }
    }
  }

  #updateHeader() {
    const backBtn = this.querySelector('[ref="backBtn"]');
    const headerTitle = this.querySelector('[ref="headerTitle"]');

    if (backBtn) {
      if (this.#panelStack.length > 1) {
        backBtn.removeAttribute('hidden');
      } else {
        backBtn.setAttribute('hidden', '');
      }
    }

    if (headerTitle) {
      if (!this.#originalHeaderHTML) {
        this.#originalHeaderHTML = headerTitle.innerHTML;
      }

      if (this.#panelStack.length <= 1) {
        headerTitle.innerHTML = this.#originalHeaderHTML;
      } else {
        const currentPanelId = this.#panelStack[this.#panelStack.length - 1];
        const currentPanel = this.querySelector(`[data-panel-id="${currentPanelId}"]`);
        const panelTitle = currentPanel?.getAttribute('data-panel-title') || '';
        headerTitle.textContent = panelTitle;
      }
    }
  }

  /* ---- Accordion ---- */

  handleAccordionToggle(event) {
    const trigger = event.currentTarget;
    const contentId = trigger.getAttribute('aria-controls');

    if (!contentId) return;

    const content = document.getElementById(contentId);

    if (!content) return;

    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isExpanded));

    if (isExpanded) {
      content.removeAttribute('data-expanded');
    } else {
      content.setAttribute('data-expanded', '');
    }
  }

  /* ---- Close Handlers ---- */

  handleOverlayClick() {
    this.close();
  }

  handleCloseClick() {
    this.close();
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
      return;
    }

    if (event.key === 'Tab' && this.refs.drawer?.hasAttribute('data-active')) {
      const focusableSelectors = 'a[href]:not([hidden]), button:not([hidden]):not([disabled]), input:not([hidden]):not([disabled]), select:not([hidden]):not([disabled]), textarea:not([hidden]):not([disabled]), [tabindex]:not([tabindex="-1"]):not([hidden])';
      const focusableElements = [...this.refs.drawer.querySelectorAll(focusableSelectors)].filter(el => el.offsetParent !== null);

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }
}

customElements.define('side-drawer-component', SideDrawerComponent);
