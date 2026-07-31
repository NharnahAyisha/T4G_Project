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
});

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

(function () {
  // Tools page helpers: BMI, Water tracker, Blood Pressure log
  function wireBMI() {
    const heightEl = document.getElementById('bmiHeight');
    const weightEl = document.getElementById('bmiWeight');
    const calcBtn = document.getElementById('bmiCalcBtn');
    const resultWrap = document.getElementById('bmiResult');
    const valueEl = document.getElementById('bmiValue');
    const categoryEl = document.getElementById('bmiCategory');
    if (!calcBtn || !heightEl || !weightEl || !resultWrap) return;

    calcBtn.addEventListener('click', () => {
      const height = parseFloat(heightEl.value);
      const weight = parseFloat(weightEl.value);
      if (!height || !weight || height <= 0 || weight <= 0) {
        // show simple feedback
        resultWrap.style.display = 'block';
        valueEl.textContent = '--';
        categoryEl.textContent = 'Please enter valid height and weight.';
        return;
      }

      const meters = height / 100;
      const bmi = weight / (meters * meters);
      const rounded = Math.round(bmi * 10) / 10;
      let category = '';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';

      valueEl.textContent = rounded.toFixed(1);
      categoryEl.textContent = category;
      resultWrap.style.display = 'block';
    });
  }

  function wireWater() {
    const WATER_KEY = 'vitabridge_water';
    const fill = document.getElementById('waterFill');
    const countEl = document.getElementById('waterCount');
    const addBtn = document.getElementById('waterAddBtn');
    const resetBtn = document.getElementById('waterResetBtn');
    const GOAL = 8;
    if (!fill || !countEl || !addBtn || !resetBtn) return;

    function todayKey() {
      return new Date().toISOString().slice(0, 10);
    }

    function load() {
      try {
        const raw = localStorage.getItem(WATER_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.error('Failed to load water data', e);
        return {};
      }
    }

    function save(data) {
      try {
        localStorage.setItem(WATER_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save water data', e);
      }
    }

    function getCount() {
      const data = load();
      return Number(data[todayKey()] || 0);
    }

    function setCount(n) {
      const data = load();
      data[todayKey()] = n;
      save(data);
    }

    function updateUI() {
      const count = getCount();
      countEl.textContent = String(count);
      const pct = Math.min(100, Math.round((count / GOAL) * 100));
      fill.style.width = pct + '%';
    }

    addBtn.addEventListener('click', () => {
      const current = getCount();
      setCount(current + 1);
      updateUI();
    });

    resetBtn.addEventListener('click', () => {
      setCount(0);
      updateUI();
    });

    // initialize
    updateUI();
  }

  function wireBP() {
    const BP_KEY = 'vitabridge_bp_readings';
    const systolicEl = document.getElementById('bpSystolic');
    const diastolicEl = document.getElementById('bpDiastolic');
    const addBtn = document.getElementById('bpAddBtn');
    const tableBody = document.getElementById('bpTableBody');
    const emptyEl = document.getElementById('bpEmpty');
    if (!systolicEl || !diastolicEl || !addBtn || !tableBody || !emptyEl) return;

    function load() {
      try {
        const raw = localStorage.getItem(BP_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Failed to load bp data', e);
        return [];
      }
    }

    function save(list) {
      try {
        localStorage.setItem(BP_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Failed to save bp data', e);
      }
    }

    function classify(s, d) {
      // simple categories
      if (s < 120 && d < 80) return 'Normal';
      if (s < 130 && d < 80) return 'Elevated';
      if ((s >= 130 && s < 140) || (d >= 80 && d < 90)) return 'Hypertension Stage 1';
      if (s >= 140 || d >= 90) return 'Hypertension Stage 2';
      return 'Uncategorized';
    }

    function render() {
      const list = load();
      tableBody.innerHTML = '';
      if (!list.length) {
        emptyEl.style.display = 'block';
        return;
      }
      emptyEl.style.display = 'none';

      list.slice().reverse().forEach((entry) => {
        const tr = document.createElement('tr');
        const dateTd = document.createElement('td');
        const readingTd = document.createElement('td');
        const catTd = document.createElement('td');
        const actionsTd = document.createElement('td');

        dateTd.textContent = new Date(entry.date).toLocaleString();
        readingTd.textContent = `${entry.systolic} / ${entry.diastolic}`;
        catTd.textContent = classify(entry.systolic, entry.diastolic);

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn btn-ghost';
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
          const remaining = load().filter((e) => e.id !== entry.id);
          save(remaining);
          render();
        });

        actionsTd.appendChild(del);
        tr.appendChild(dateTd);
        tr.appendChild(readingTd);
        tr.appendChild(catTd);
        tr.appendChild(actionsTd);
        tableBody.appendChild(tr);
      });
    }

    addBtn.addEventListener('click', () => {
      const s = parseInt(systolicEl.value, 10);
      const d = parseInt(diastolicEl.value, 10);
      if (!s || !d || s <= 0 || d <= 0) {
        alert('Please enter valid numeric systolic and diastolic values.');
        return;
      }

      const list = load();
      list.push({ id: Date.now(), date: new Date().toISOString(), systolic: s, diastolic: d });
      save(list);
      systolicEl.value = '';
      diastolicEl.value = '';
      render();
    });

    render();
  }

  function wireTools() {
    wireBMI();
    wireWater();
    wireBP();
  }

  // initialize tools when tools page loads
  document.addEventListener('DOMContentLoaded', wireTools);
})();
