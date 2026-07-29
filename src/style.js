// Toggle mobile navigation dropdown
/*const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

hamburger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close mobile nav when a link is clicked
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

emailjs.init("YOUR_PUBLIC_KEY");

const form = document.getElementById("contact-form");
const successMessage = document.getElementById("success-message");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    emailjs.sendForm(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        form
    ).then(function () {

        successMessage.classList.add("show");
        form.reset();

    }).catch(function (error) {

        alert("Message failed to send.");
        console.log(error);

    });
});*/

/* =========================================================
   VitaBridge - cart.js
   Small, plain JavaScript file shared by every page.
   Handles: adding products to the cart, updating quantities,
   removing items, calculating totals, and keeping the cart
   badge in the nav in sync. No frameworks, no build step.
   Cart data is kept in localStorage so it survives a page
   reload/navigation between pages on the same site.
   ========================================================= */

const CART_KEY = "vitabridge_cart";
const DELIVERY_FEE = 30;

/* ---------- storage helpers ---------- */

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Could not read cart from storage:", err);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("Could not save cart to storage:", err);
  }
}

/* ---------- cart operations ---------- */

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.name === product.name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: product.name,
      price: Number(product.price),
      image: product.image,
      qty: 1,
    });
  }

  saveCart(cart);
  updateCartBadge();
}

function updateQty(name, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.name === name);
  if (!item) return;

  item.qty += delta;
  if (item.qty < 1) item.qty = 1;

  saveCart(cart);
  renderCartPage();
}

function removeFromCart(name) {
  const cart = getCart().filter((i) => i.name !== name);
  saveCart(cart);
  renderCartPage();
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.qty * item.price, 0);
}

/* ---------- nav badge (every page) ---------- */

function updateCartBadge() {
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;

  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

/* ---------- Products page wiring ---------- */

function wireAddToCartButtons() {
  const buttons = document.querySelectorAll(".js-add-to-cart");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-name]");
      if (!card) return;

      addToCart({
        name: card.dataset.name,
        price: card.dataset.price,
        image: card.dataset.image,
      });

      const originalText = btn.innerHTML;
      btn.classList.add("added");
      btn.innerHTML = "Added &#10003;".replace("&#10003;", "\u2713");
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = originalText;
      }, 1200);
    });
  });
}

/* ---------- Cart page rendering ---------- */

function renderCartPage() {
  const container = document.querySelector("[data-cart-root]");
  if (!container) return; // not on the cart page

  const cart = getCart();
  const itemsWrap = container.querySelector(".cart-items");
  const emptyState = container.querySelector(".empty-cart");
  const summaryWrap = container.querySelector(".cart-summary-wrap");

  if (cart.length === 0) {
    if (itemsWrap) itemsWrap.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (summaryWrap) summaryWrap.style.display = "none";
    updateCartBadge();
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (summaryWrap) summaryWrap.style.display = "grid";

  if (itemsWrap) {
    itemsWrap.innerHTML = cart
      .map(
        (item) => `
      <article class="cart-item" data-item="${item.name}">
        <div class="product-photo">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="unit-price">GHS ${item.price}</p>
        </div>
        <div class="qty-stepper">
          <button type="button" class="js-qty-down" aria-label="Decrease quantity">&minus;</button>
          <span>${item.qty}</span>
          <button type="button" class="js-qty-up" aria-label="Increase quantity">&#43;</button>
        </div>
        <p class="cart-item-total">GHS ${item.qty * item.price}</p>
        <button type="button" class="cart-remove js-remove" aria-label="Remove item">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </article>`
      )
      .join("");

    itemsWrap.querySelectorAll(".js-qty-up").forEach((btn) =>
      btn.addEventListener("click", () =>
        updateQty(btn.closest("[data-item]").dataset.item, 1)
      )
    );
    itemsWrap.querySelectorAll(".js-qty-down").forEach((btn) =>
      btn.addEventListener("click", () =>
        updateQty(btn.closest("[data-item]").dataset.item, -1)
      )
    );
    itemsWrap.querySelectorAll(".js-remove").forEach((btn) =>
      btn.addEventListener("click", () =>
        removeFromCart(btn.closest("[data-item]").dataset.item)
      )
    );
  }

  const subtotal = cartSubtotal();
  const total = subtotal + DELIVERY_FEE;

  const subtotalEl = container.querySelector(".js-subtotal");
  const deliveryEl = container.querySelector(".js-delivery");
  const totalEl = container.querySelector(".js-total");

  if (subtotalEl) subtotalEl.textContent = `GHS ${subtotal}`;
  if (deliveryEl) deliveryEl.textContent = `GHS ${DELIVERY_FEE}`;
  if (totalEl) totalEl.textContent = `GHS ${total}`;

  updateCartBadge();
}

/* ---------- init on every page ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  wireAddToCartButtons();
  renderCartPage();
});