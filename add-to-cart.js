// Cart Handler Class
class CartHandler {
  constructor() {
    this.init();
  }

  init() {
    // Handle add to cart button clicks
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('.single_add_to_cart_button');
      if (!addToCartBtn) return;

      e.preventDefault();

      if (addToCartBtn.classList.contains('disabled') || addToCartBtn.classList.contains('nasa-ct-disabled')) {
        if (addToCartBtn.classList.contains('wc-variation-is-unavailable')) {
          window.alert(wc_add_to_cart_variation_params.i18n_unavailable_text);
        } else if (addToCartBtn.classList.contains('wc-variation-selection-needed')) {
          window.alert(wc_add_to_cart_variation_params.i18n_make_a_selection_text);
        }
        return;
      }

      const form = addToCartBtn.closest('form.cart');
      if (!form) return;

      this.handleAddToCart(form, addToCartBtn);
    });

    // Handle quantity buttons
    document.addEventListener('click', (e) => {
      const qtyBtn = e.target.closest('.plus, .minus');
      if (!qtyBtn) return;

      e.preventDefault();
      
      const input = qtyBtn.closest('.quantity').querySelector('.qty');
      const currentVal = parseFloat(input.value);
      const max = input.getAttribute('max');
      const min = input.getAttribute('min');
      const step = parseFloat(input.getAttribute('step') || '1');

      let newVal;
      if (qtyBtn.classList.contains('plus')) {
        newVal = currentVal + step;
        if (max && newVal > parseFloat(max)) {
          newVal = max;
        }
      } else {
        newVal = currentVal - step;
        if (min && newVal < parseFloat(min)) {
          newVal = min;
        }
      }

      input.value = newVal;
      input.dispatchEvent(new Event('change'));
    });
  }

  async handleAddToCart(form, button) {
    const productId = form.querySelector('input[name="product_id"]').value;
    const variationId = form.querySelector('input[name="variation_id"]').value;
    const quantity = form.querySelector('input[name="quantity"]').value;
    const variations = {};

    // Get selected variations
    form.querySelectorAll('.variations select').forEach(select => {
      variations[select.name] = select.value;
    });

    button.classList.add('loading');

    try {
      const formData = new FormData();
      formData.append('product_id', productId);
      formData.append('quantity', quantity);

      if (variationId) {
        formData.append('variation_id', variationId);
        Object.entries(variations).forEach(([name, value]) => {
          formData.append(name, value);
        });
      }

      const response = await fetch(wc_add_to_cart_params.wc_ajax_url.replace('%%endpoint%%', 'add_to_cart'), {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message);
      }

      // Update cart fragments
      if (data.fragments) {
        this.updateCartFragments(data.fragments);
      }

      // Update cart hash
      if (data.cart_hash) {
        this.updateCartHash(data.cart_hash);
      }

      // Add success class
      button.classList.add('added');
      button.classList.remove('loading');

      // Trigger events
      document.body.dispatchEvent(new CustomEvent('added_to_cart', {
        detail: {
          button: button,
          fragments: data.fragments,
          cart_hash: data.cart_hash,
          variation: variations
        }
      }));

      // Show cart sidebar if enabled
      const cartSidebar = document.getElementById('cart-sidebar');
      if (cartSidebar) {
        cartSidebar.classList.add('nasa-active');
        document.querySelector('.black-window').classList.add('desk-window');
        document.body.classList.add('nasa-minicart-active');
      }

    } catch (error) {
      console.error('Add to cart error:', error);
      button.classList.remove('loading');
      window.alert(error.message || wc_add_to_cart_params.i18n_error_message);
    }
  }

  updateCartFragments(fragments) {
    Object.entries(fragments).forEach(([selector, content]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.outerHTML = content;
      });
    });

    // Store fragments in session storage
    if (window.sessionStorage) {
      sessionStorage.setItem(wc_cart_fragments_params.fragment_name, JSON.stringify(fragments));
    }
  }

  updateCartHash(hash) {
    const storage = window.sessionStorage;
    if (storage) {
      storage.setItem(wc_cart_fragments_params.cart_hash_key, hash);
      storage.setItem('wc_cart_created', (new Date()).getTime());
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new CartHandler();
});
