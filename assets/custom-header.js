import { Component } from '@theme/component';

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

class CustomHeaderComponent extends Component {
  /** @type {AbortController|null} */
  #abortController = null;

  /** @type {Function} */
  #debouncedSearch;

  connectedCallback() {
    super.connectedCallback();
    this.#debouncedSearch = debounce(this.#performSearch.bind(this), 300);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  /* ---- Mobile search toggle ---- */

  handleOpenMobileSearch() {
    if (this.refs.mobileSearch) {
      this.refs.mobileSearch.setAttribute('data-active', '');
    }
    if (this.refs.mobileSearchInput) {
      this.refs.mobileSearchInput.focus();
    }
  }

  handleCloseMobileSearch() {
    if (this.refs.mobileSearch) {
      this.refs.mobileSearch.removeAttribute('data-active');
    }
    if (this.refs.mobileSearchResults) {
      this.refs.mobileSearchResults.removeAttribute('data-visible');
    }
    if (this.refs.mobileSearchInput) {
      this.refs.mobileSearchInput.value = '';
    }
  }

  /* ---- Drawer ---- */

  handleOpenDrawer() {
    if (this.refs.drawer) {
      this.refs.drawer.setAttribute('data-active', '');
    }
    if (this.refs.drawerOverlay) {
      this.refs.drawerOverlay.setAttribute('data-active', '');
    }
    document.body.style.overflow = 'hidden';

    if (this.refs.drawerClose) {
      this.refs.drawerClose.focus();
    }
  }

  handleCloseDrawer() {
    if (this.refs.drawer) {
      this.refs.drawer.removeAttribute('data-active');
    }
    if (this.refs.drawerOverlay) {
      this.refs.drawerOverlay.removeAttribute('data-active');
    }
    document.body.style.overflow = '';
  }

  handleDrawerKeydown(event) {
    if (event.key === 'Escape') {
      this.handleCloseDrawer();
    }
  }

  /* ---- Desktop search ---- */

  handleSearchInput(event) {
    const query = event.target.value.trim();

    if (query.length < 2) {
      this.#hideSearchResults();
      return;
    }

    this.#debouncedSearch(query, 'desktop');
  }

  /* ---- Mobile search ---- */

  handleMobileSearchInput(event) {
    const query = event.target.value.trim();

    if (query.length < 2) {
      this.#hideMobileSearchResults();
      return;
    }

    this.#debouncedSearch(query, 'mobile');
  }

  /* ---- Search logic ---- */

  async #performSearch(query, context = 'desktop') {
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    const resultsContainer = context === 'mobile'
      ? this.refs.mobileSearchResults
      : this.refs.searchResults;

    if (!resultsContainer) return;

    resultsContainer.setAttribute('data-visible', '');
    resultsContainer.innerHTML = '<div class="custom-header__search-loading">Searching...</div>';

    try {
      const searchUrl = `${window.Shopify?.routes?.root || '/'}search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`;

      const response = await fetch(searchUrl, {
        signal: this.#abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data.resources?.results?.products || [];

      if (products.length === 0) {
        resultsContainer.innerHTML = '<div class="custom-header__search-no-results">No results found</div>';
        return;
      }

      resultsContainer.innerHTML = '<div class="custom-header__search-results-inner">' +
        products.map(product => {
          const image = product.image
            ? `<img class="custom-header__search-result-image" src="${product.image}" alt="${this.#escapeHtml(product.title)}" loading="lazy" width="40" height="40">`
            : '';
          return `<a href="${product.url}" class="custom-header__search-result-item">
            ${image}
            <span class="custom-header__search-result-title">${this.#escapeHtml(product.title)}</span>
          </a>`;
        }).join('') +
        '</div>';
    } catch (error) {
      if (error.name === 'AbortError') return;
      resultsContainer.innerHTML = '<div class="custom-header__search-no-results">Search unavailable</div>';
    }
  }

  #hideSearchResults() {
    if (this.refs.searchResults) {
      this.refs.searchResults.removeAttribute('data-visible');
      this.refs.searchResults.innerHTML = '';
    }
  }

  #hideMobileSearchResults() {
    if (this.refs.mobileSearchResults) {
      this.refs.mobileSearchResults.removeAttribute('data-visible');
      this.refs.mobileSearchResults.innerHTML = '';
    }
  }

  #escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('custom-header-component', CustomHeaderComponent);
