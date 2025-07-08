class WcAddToCartHandler {
  constructor() {
    this.initializeEvents();
  }

  initializeEvents() {
    // Handle "Add to Cart" button clicks
    document.addEventListener('click', (e) => {
      const addToCartButton = e.target.closest('.add_to_cart_button');
      if (!addToCartButton) return;

      e.preventDefault();

      // Check if the button is disabled
      if (addToCartButton.classList.contains('disabled')) {
        console.warn('Add to Cart button is disabled.');
        return;
      }

      // Handle AJAX add to cart
      this.handleAddToCart(addToCartButton);
    });

    // Handle "Remove from Cart" button clicks
    document.addEventListener('click', (e) => {
      const removeButton = e.target.closest('.remove_from_cart_button');
      if (!removeButton) return;

      e.preventDefault();

      // Handle AJAX remove from cart
      this.handleRemoveFromCart(removeButton);
    });
  }

  async handleAddToCart(button) {
    const form = button.closest('form.cart');
    if (!form) return;

    // Get product data
    const productId = form.querySelector('input[name="product_id"]').value;
    const variationId = form.querySelector('input[name="variation_id"]')?.value;
    const quantity = form.querySelector('input[name="quantity"]').value || 1;

    // Prepare form data
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('quantity', quantity);

    if (variationId) {
      formData.append('variation_id', variationId);

      // Add variation attributes
      form.querySelectorAll('.variations select').forEach((select) => {
        formData.append(select.name, select.value);
      });
    }

    // Add security nonce
    formData.append('security', wc_add_to_cart_params.nonce);

    // Add loading state
    button.classList.add('loading');

    try {
      // Send AJAX request
      const response = await fetch(wc_add_to_cart_params.wc_ajax_url.replace('%%endpoint%%', 'add_to_cart'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message);
      }

      // Update cart fragments
      if (data.fragments) {
        this.updateCartFragments(data.fragments);
      }

      // Add success class
      button.classList.add('added');
    } catch (error) {
      console.error('Add to Cart Error:', error);
      alert(error.message || 'An error occurred while adding the product to the cart.');
    } finally {
      // Remove loading state
      button.classList.remove('loading');
    }
  }

  async handleRemoveFromCart(button) {
    const cartItemKey = button.dataset.cart_item_key;
    if (!cartItemKey) return;

    // Add loading state
    button.closest('.woocommerce-mini-cart-item')?.classList.add('loading');

    try {
      // Send AJAX request
      const response = await fetch(wc_add_to_cart_params.wc_ajax_url.replace('%%endpoint%%', 'remove_from_cart'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          cart_item_key: cartItemKey,
          security: wc_add_to_cart_params.nonce,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message);
      }

      // Update cart fragments
      if (data.fragments) {
        this.updateCartFragments(data.fragments);
      }
    } catch (error) {
      console.error('Remove from Cart Error:', error);
      alert(error.message || 'An error occurred while removing the product from the cart.');
    } finally {
      // Remove loading state
      button.closest('.woocommerce-mini-cart-item')?.classList.remove('loading');
    }
  }

  updateCartFragments(fragments) {
    // Replace fragments in the DOM
    Object.entries(fragments).forEach(([selector, content]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.outerHTML = content;
      }
    });

    // Trigger custom event
    document.dispatchEvent(new Event('wc_fragments_updated'));
  }
}

// Initialize the handler
document.addEventListener('DOMContentLoaded', () => {
  if (typeof wc_add_to_cart_params !== 'undefined') {
    new WcAddToCartHandler();
  } else {
    console.error('wc_add_to_cart_params is not defined. Ensure WooCommerce is active and configured.');
  }
});
