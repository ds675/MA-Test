import { Component } from '@theme/component';

/**
 * Per-Serving Price Component
 *
 * Listens for variant:update events from Horizon's product form and recalculates
 * the per-serving price based on the new variant's price and serving count.
 *
 * @extends {Component}
 */
class PdpPerServingComponent extends Component {
  /** @type {Map<string, number>} */
  #servingMap = new Map();

  /** @type {AbortController | null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();

    const mapData = this.dataset.servingMap;

    if (mapData) {
      try {
        const parsed = JSON.parse(mapData);

        for (const [variantId, serving] of Object.entries(parsed)) {
          this.#servingMap.set(String(variantId), Number(serving));
        }
      } catch {
        // Silently fail if JSON is invalid
      }
    }

    this.#abortController = new AbortController();

    document.addEventListener('variant:update', this.#handleVariantUpdate.bind(this), {
      signal: this.#abortController.signal,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
    this.#abortController = null;
  }

  /**
   * @param {CustomEvent} event
   */
  #handleVariantUpdate(event) {
    const variant = event.detail?.resource;

    if (!variant?.id) return;

    const serving = this.#servingMap.get(String(variant.id));

    if (!serving || serving <= 0) {
      if (this.refs.perServingPrice) {
        this.refs.perServingPrice.textContent = '';
      }
      return;
    }

    const priceInCents = variant.price;

    if (typeof priceInCents !== 'number') return;

    const perServingCents = Math.round(priceInCents / serving);
    const formatted = (perServingCents / 100).toFixed(2);
    const moneyFormatted = `$${formatted}`;

    if (this.refs.perServingPrice) {
      this.refs.perServingPrice.textContent = moneyFormatted;
    }
  }
}

customElements.define('pdp-per-serving', PdpPerServingComponent);

/**
 * Subscription Widget Component
 *
 * Handles toggling between one-time purchase and subscribe & save options.
 *
 * @extends {Component}
 */
class PdpSubscriptionComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Handles selecting an option (one-time or subscribe).
   *
   * @param {Event} event
   */
  handleSelectOption(event) {
    const target = event.currentTarget;
    const option = target.closest('[data-option]');

    if (!option) return;

    const options = this.querySelectorAll('[data-option]');

    for (const opt of options) {
      const radio = opt.querySelector('input[type="radio"]');
      const isSelected = opt === option;

      opt.setAttribute('data-selected', String(isSelected));

      if (radio) {
        radio.checked = isSelected;
      }
    }
  }
}

customElements.define('pdp-subscription', PdpSubscriptionComponent);

/**
 * Accordions Component
 *
 * Accessible expand/collapse with aria-expanded toggling.
 *
 * @extends {Component}
 */
class PdpAccordionsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Toggle an accordion panel.
   *
   * @param {Event} event
   */
  handleToggle(event) {
    const button = event.currentTarget;
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? this.querySelector(`#${panelId}`) : null;

    button.setAttribute('aria-expanded', String(!isExpanded));

    if (panel) {
      panel.setAttribute('data-open', String(!isExpanded));
    }
  }
}

customElements.define('pdp-accordions', PdpAccordionsComponent);
