//VITABRIDGE - style.js

/*1. CART - storage helpers
The cart is just an array of objects saved as a JSON string
under one localStorage key. These two functions are the only
place that actually reads/writes that key, so if anything
ever needs to change (e.g. renaming the key), it only needs
to change here.*/


const CART_KEY = "vitabridge_cart";

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


/* =============================================================
   2. CART - add / update / remove items
   ============================================================= */

// Adds one unit of a product to the cart. If it's already in
// the cart, this just bumps the quantity by 1 instead of
// creating a duplicate row.
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.name === product.name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: product.name,
      price: Number(product.price),
      image: product.image, // each product keeps its OWN image path here
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
  if (item.qty < 1) item.qty = 1; // never let it drop below 1 - use Remove for that

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


/* =============================================================
   3. CART - nav badge (every page)
   -------------------------------------------------------------
   The small green number next to the cart icon in the header.
   Every page has this icon, so this function is called on
   every page load to keep it accurate.
   ============================================================= */

function updateCartBadge() {
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;

  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}


/* =============================================================
   4. CART - "Add to Cart" buttons (Products page)
   -------------------------------------------------------------
   Each product card in products.html carries its own details
   as data-* attributes, e.g.:
     <article class="product-card" data-name="..." data-price="..." data-image="...">
   That's what makes "the item clicked shows its own image" work:
   we read data-image straight off THAT card and store it with
   the cart line, so every product keeps its own correct photo
   all the way through to the Cart page.
   ============================================================= */

function wireAddToCartButtons() {
  const buttons = document.querySelectorAll(".js-add-to-cart");
  if (!buttons.length) return; // not on the products page

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-name]");
      if (!card) return;

      addToCart({
        name: card.dataset.name,
        price: card.dataset.price,
        image: card.dataset.image,
      });

      // brief "Added ✓" feedback on the button itself
      const originalText = btn.innerHTML;
      btn.classList.add("added");
      btn.innerHTML = "Added \u2713";
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = originalText;
      }, 1200);
    });
  });
}


/* =============================================================
   5. CART - rendering the Cart page itself
   -------------------------------------------------------------
   This rebuilds the whole cart section every time something
   changes (item added/removed, quantity changed, delivery
   location changed). 
   ============================================================= */

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
    hideCheckoutPanel(); // if the cart becomes empty, hide any open payment panel too
    updateCartBadge();
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (summaryWrap) summaryWrap.style.display = "grid";

  if (itemsWrap) {
    // build one row of HTML per cart item - each <img> uses THAT
    // item's own saved image, never a shared/generic one
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

    // wire up the buttons on the rows we just created
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

  // totals
  const subtotal = cartSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = subtotal + deliveryFee;

  const subtotalEl = container.querySelector(".js-subtotal");
  const deliveryEl = container.querySelector(".js-delivery");
  const totalEl = container.querySelector(".js-total");

  if (subtotalEl) subtotalEl.textContent = `GHS ${subtotal}`;
  if (deliveryEl) deliveryEl.textContent = `GHS ${deliveryFee}`;
  if (totalEl) totalEl.textContent = `GHS ${total}`;

  // keep the checkout panel's total in sync too, if it's open
  const checkoutTotalEl = container.querySelector(".js-checkout-total");
  if (checkoutTotalEl) checkoutTotalEl.textContent = `GHS ${total}`;

  updateCartBadge();
}


/* =============================================================
   6. CART - delivery location (Accra vs other regions)
   -------------------------------------------------------------
   Delivery is NOT a fixed price - it depends on which radio
   button (Accra / Other Regions) is selected. The chosen value
   is remembered in localStorage so it's still selected next
   time the shopper opens the cart.
   ============================================================= */

const DELIVERY_KEY = "vitabridge_delivery_location";

function getDeliveryFee() {
  const checked = document.querySelector(".js-delivery-radio:checked");
  if (checked) return Number(checked.value);

  // fall back to whatever was last saved, or Accra's rate by default
  const saved = localStorage.getItem(DELIVERY_KEY);
  return saved ? Number(saved) : 15;
}

function wireDeliveryLocation() {
  const radios = document.querySelectorAll(".js-delivery-radio");
  if (!radios.length) return; // not on the cart page

  // restore the shopper's last choice
  const saved = localStorage.getItem(DELIVERY_KEY);
  if (saved) {
    const match = document.querySelector(`.js-delivery-radio[value="${saved}"]`);
    if (match) match.checked = true;
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      localStorage.setItem(DELIVERY_KEY, radio.value);
      renderCartPage(); // recalculates the total with the new fee
    });
  });
}


/* =============================================================
   7. CHECKOUT - Mobile Money payment flow (Cart page)
     1. Shopper clicks "Proceed to Checkout"
        -> the MoMo panel appears showing the exact total to
           send and the MoMo number/name to send it to.
     2. Shopper actually sends the money on their phone (outside
        this website, in their MoMo app).
     3. Shopper clicks "I've Sent Payment"
        -> a confirmation message appears. This does NOT verify
           the payment was really made. it just acknowledges the
           order so the shopper knows what happens next, and
           suggests sending a screenshot on WhatsApp so a I can confirm it manually.
   ============================================================= */

function showCheckoutPanel() {
  const panel = document.getElementById("checkoutPanel");
  if (!panel) return;
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideCheckoutPanel() {
  const panel = document.getElementById("checkoutPanel");
  const confirmation = document.getElementById("checkoutConfirmation");
  if (panel) panel.style.display = "none";
  if (confirmation) confirmation.style.display = "none";
}

function wireCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const confirmBtn = document.getElementById("confirmPaymentBtn");
  if (!checkoutBtn) return; // not on the cart page

  checkoutBtn.addEventListener("click", () => {
    if (cartCount() === 0) return; // nothing to check out
    showCheckoutPanel();
  });

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const confirmation = document.getElementById("checkoutConfirmation");
      if (confirmation) confirmation.style.display = "flex";
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Payment Noted";
    });
  }
}


//8. PRODUCTS - category filter heading/count
function wireCategoryFilter() {
  const heading = document.getElementById("productsHeading");
  const radios = document.querySelectorAll(".category-filter-input");
  if (!heading || !radios.length) return; // not on the products page

  const labels = {
    "tab-all": "All Products",
    "tab-health": "Health Devices",
    "tab-firstaid": "First Aid",
    "tab-sanitation": "Sanitation",
    "tab-personal": "Personal care",
  };

  function updateHeading() {
    const checked = document.querySelector(".category-filter-input:checked");
    if (!checked) return;

    const label = labels[checked.id] || "All Products";
    const visibleCount = document.querySelectorAll(
      `.products-grid .product-card${
        checked.id === "tab-all" ? "" : "." + checked.id.replace("tab-", "cat-")
      }`
    ).length;

    heading.childNodes[0].nodeValue = label + " ";
    const countEl = heading.querySelector(".results-count");
    if (countEl) countEl.textContent = `(${visibleCount})`;
  }

  radios.forEach((radio) => radio.addEventListener("change", updateHeading));
  updateHeading(); // set the correct heading on first load too
}



//9. AUTH - password show/hide eye icon (Login / Sign up)

const EYE_OPEN_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';

const EYE_CLOSED_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6.5 0-10-7-10-7a18.6 18.6 0 0 1 4.22-5.06M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>';

function wirePasswordToggles() {
  const buttons = document.querySelectorAll(".js-toggle-password");
  if (!buttons.length) return; // not on a page with password fields

  buttons.forEach((btn) => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    btn.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.innerHTML = isHidden ? EYE_CLOSED_ICON : EYE_OPEN_ICON;
      btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });
}


/* =============================================================
   10. HEALTH TOOLS - BMI Checker
   ============================================================= */

function calculateBMI() {
  const heightInput = document.getElementById("bmiHeight");
  const weightInput = document.getElementById("bmiWeight");
  const resultBox = document.getElementById("bmiResult");
  const valueEl = document.getElementById("bmiValue");
  const categoryEl = document.getElementById("bmiCategory");

  const heightCm = parseFloat(heightInput.value);
  const weightKg = parseFloat(weightInput.value);

  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    resultBox.style.display = "flex";
    valueEl.textContent = "--";
    categoryEl.textContent = "Enter a valid height and weight";
    categoryEl.className = "bmi-category";
    return;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  let category, className;
  if (bmi < 18.5) {
    category = "Underweight";
    className = "underweight";
  } else if (bmi < 25) {
    category = "Normal weight";
    className = "normal";
  } else if (bmi < 30) {
    category = "Overweight";
    className = "overweight";
  } else {
    category = "Obese";
    className = "obese";
  }

  resultBox.style.display = "flex";
  valueEl.textContent = rounded;
  categoryEl.textContent = category;
  categoryEl.className = "bmi-category " + className;
}

function wireBMIChecker() {
  const btn = document.getElementById("bmiCalcBtn");
  if (!btn) return; // not on the tools page

  btn.addEventListener("click", calculateBMI);

  // allow pressing Enter inside either field instead of only the button
  ["bmiHeight", "bmiWeight"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        calculateBMI();
      }
    });
  });
}


/* =============================================================
   11. HEALTH TOOLS - Water Intake Tracker
   -------------------------------------------------------------
   Resets automatically each day: every time we read the saved
   data, we check whether its stored date matches today's date.
   If not, we treat it as a fresh day (count = 0) - no need for
   a scheduled task or anything fancy.
   ============================================================= */

const WATER_KEY = "vitabridge_water_intake";
const WATER_GOAL = 8; // glasses per day

function todayString() {
  return new Date().toISOString().split("T")[0]; // "2026-07-31" style
}

function getWaterData() {
  try {
    const raw = localStorage.getItem(WATER_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || data.date !== todayString()) {
      return { date: todayString(), count: 0 }; // new day, start over
    }
    return data;
  } catch (err) {
    console.error("Could not read water🥛 intake data:", err);
    return { date: todayString(), count: 0 };
  }
}

function saveWaterData(data) {
  try {
    localStorage.setItem(WATER_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Could not save water🥛 intake data:", err);
  }
}

function renderWaterTracker() {
  const countEl = document.getElementById("waterCount");
  const fillEl = document.getElementById("waterFill");
  if (!countEl || !fillEl) return; // not on the tools page

  const data = getWaterData();
  countEl.textContent = data.count;

  const percent = Math.min(100, Math.round((data.count / WATER_GOAL) * 100));
  fillEl.style.width = percent + "%";
}

function wireWaterTracker() {
  const addBtn = document.getElementById("waterAddBtn");
  const resetBtn = document.getElementById("waterResetBtn");
  if (!addBtn) return; // not on the tools page

  addBtn.addEventListener("click", () => {
    const data = getWaterData();
    data.count += 1;
    saveWaterData(data);
    renderWaterTracker();
  });

  resetBtn.addEventListener("click", () => {
    saveWaterData({ date: todayString(), count: 0 });
    renderWaterTracker();
  });

  renderWaterTracker(); // show today's progress as soon as the page loads
}


/* =============================================================
   12. HEALTH TOOLS - Blood Pressure Log
   ============================================================= */

const BP_KEY = "vitabridge_bp_log";

function getBPLog() {
  try {
    const raw = localStorage.getItem(BP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Could not read BP log:", err);
    return [];
  }
}

function saveBPLog(entries) {
  try {
    localStorage.setItem(BP_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Could not save BP log:", err);
  }
}

// Simplified, standard blood-pressure category ranges.
function classifyBP(systolic, diastolic) {
  if (systolic >= 140 || diastolic >= 90) {
    return { label: "High (Stage 2)", className: "high2" };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { label: "High (Stage 1)", className: "high1" };
  }
  if (systolic >= 120 || diastolic >= 80) {
    return { label: "Elevated", className: "elevated" };
  }
  return { label: "Normal", className: "normal" };
  
}

function renderBPLog() {
  const tableBody = document.getElementById("bpTableBody");
  const table = document.getElementById("bpTable");
  const emptyMsg = document.getElementById("bpEmpty");
  if (!tableBody) return; // not on the tools page

  const entries = getBPLog();

  if (entries.length === 0) {
    table.style.display = "none";
    emptyMsg.style.display = "block";
    return;
  }

  table.style.display = "table";
  emptyMsg.style.display = "none";

  // newest reading first
  tableBody.innerHTML = entries
    .slice()
    .reverse()
    .map((entry) => {
      const cat = classifyBP(entry.systolic, entry.diastolic);
      return `
      <tr data-id="${entry.id}">
        <td>${entry.date}</td>
        <td>${entry.systolic}/${entry.diastolic} mmHg</td>
        <td><span class="bp-category-tag ${cat.className}">${cat.label}</span></td>
        <td>
          <button type="button" class="bp-delete-btn js-bp-delete" aria-label="Delete reading">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </td>
      </tr>`;
    })
    .join("");

  tableBody.querySelectorAll(".js-bp-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest("tr").dataset.id;
      const updated = getBPLog().filter((e) => String(e.id) !== id);
      saveBPLog(updated);
      renderBPLog();
    });
  });
}

function wireBPLog() {
  const addBtn = document.getElementById("bpAddBtn");
  if (!addBtn) return; // not on the tools page

  addBtn.addEventListener("click", () => {
    const systolicInput = document.getElementById("bpSystolic");
    const diastolicInput = document.getElementById("bpDiastolic");

    const systolic = parseInt(systolicInput.value, 10);
    const diastolic = parseInt(diastolicInput.value, 10);

    if (!systolic || !diastolic || systolic <= 0 || diastolic <= 0) {
      return; // silently ignore invalid/empty input
    }

    const entries = getBPLog();
    entries.push({
      id: Date.now(), // good enough as a unique id for this simple case
      date: todayString(),
      systolic,
      diastolic,
    });
    saveBPLog(entries);

    systolicInput.value = "";
    diastolicInput.value = "";
    renderBPLog();
  });

  renderBPLog(); // show any previously saved readings on page load
}


document.addEventListener("DOMContentLoaded", () => {
  // cart + nav badge (relevant on every page, since every page has the nav)
  updateCartBadge();
  wireAddToCartButtons();
  wireDeliveryLocation();
  renderCartPage();
  wireCheckout();

  // products page only
  wireCategoryFilter();

  // login / sign up pages only
  wirePasswordToggles();

  // health tools page only
  wireBMIChecker();
  wireWaterTracker();
  wireBPLog();
});