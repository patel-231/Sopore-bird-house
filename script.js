// static site script (no backend required)
// IMPORTANT: all paths and folder names are lowercase: assets/ and assets/products/

/* ====== CONFIG - replace these placeholders before publishing ====== */
const CONFIG = {
  upi_id: "demo@upi",               // replace with your real upi id
  whatsapp_phone: "919000000000"    // replace with your full phone (country code, no +), e.g. 919876543210
};
/* ================================================================== */

// product list (static)
const products = [
  { id: 1, name: "classic wood birdhouse", price: 350, image: "assets/products/bird1.jpg", sold: 12 },
  { id: 2, name: "hanging birdhouse", price: 450, image: "assets/products/bird2.jpg", sold: 35 },
  { id: 3, name: "luxury painted birdhouse", price: 1200, image: "assets/products/bird3.jpg", sold: 7 }
];

let cart = {}; // { productId: qty }

// render products
function renderProducts() {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  products.forEach(p => {
    const el = document.createElement("div");
    el.className = "product";
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">
      <h4>${p.name}</h4>
      <p>${p.sold > 5 ? '<span style="color:#0b8a3d;font-weight:600">hot</span>' : ''}</p>
      <p class="price">₹ ${p.price}</p>
      <div class="actions">
        <button onclick="addToCart(${p.id})">add to cart</button>
        <button onclick="buyNow(${p.id})" style="margin-left:8px;background:#4caf50">buy now</button>
      </div>
    `;
    container.appendChild(el);
  });
}

// render most selling
function renderMostSelling() {
  const ul = document.getElementById("most-selling-list");
  const top = products.slice().sort((a,b) => b.sold - a.sold).slice(0,5);
  ul.innerHTML = top.map(t => `<li>${t.name} — sold ${t.sold}</li>`).join("");
}

// cart helpers
function updateCartCount() {
  const count = Object.values(cart).reduce((s,q) => s + q, 0);
  document.getElementById("cart-count").innerText = count;
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCartCount();
  alert("added to cart");
}

function buyNow(id) {
  cart = {};
  cart[id] = 1;
  updateCartCount();
  document.getElementById("cust-name").focus();
}

// order submission -> uses whatsapp link (no backend)
document.getElementById("order-form").addEventListener("submit", function(e){
  e.preventDefault();
  if(Object.keys(cart).length === 0) {
    alert("cart is empty");
    return;
  }
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();
  if(!name || !phone || !address) {
    alert("please fill all fields");
    return;
  }

  // build message
  let msg = `Order from Sopore Bird House%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AAddress: ${encodeURIComponent(address)}%0A%0AItems:%0A`;
  let total = 0;
  Object.keys(cart).forEach((pid, idx) => {
    const p = products.find(x => x.id === Number(pid));
    const qty = cart[pid];
    msg += `${idx+1}. ${p.name} x ${qty} = ₹${p.price * qty}%0A`;
    total += p.price * qty;
  });
  msg += `%0ATotal: ₹${total}%0A%0APlease confirm the order.`;

  // whatsapp link (open in new tab)
  const wa = `https://wa.me/${CONFIG.whatsapp_phone}?text=${msg}`;
  window.open(wa, "_blank");

  // show quick payment link & qr guidance
  const qrText = `upi://pay?pa=${encodeURIComponent(CONFIG.upi_id)}&pn=${encodeURIComponent("Sopore Bird House")}&tn=${encodeURIComponent("Order Payment")}&am=${encodeURIComponent(total)}`;
  const resultEl = document.getElementById("order-result");
  resultEl.innerHTML = `<div style="padding:12px;background:#effff2;border:1px solid #c8f1d1;border-radius:8px">
    Order prepared. Total: <strong>₹${total}</strong>. <br>
    Send via WhatsApp or scan QR to pay. <br>
    <small>If qr doesn't open on your phone, open your payments app and use the upi id: <strong>${CONFIG.upi_id}</strong></small>
    <p style="margin-top:8px"><a href="${qrText}" target="_blank">open upi link</a></p>
  </div>`;

  // optional: update qr image to reflect amount as data (uses qrserver)
  const qrImg = document.getElementById("qr-img");
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
});

// view cart button opens a simple summary modal (alert)
document.getElementById("view-cart-btn").addEventListener("click", function(){
  if(Object.keys(cart).length === 0) { alert("cart is empty"); return; }
  let text = "cart items:\n\n";
  let total = 0;
  Object.keys(cart).forEach(pid => {
    const p = products.find(x => x.id === Number(pid));
    const qty = cart[pid];
    text += `${p.name} x ${qty} = ₹${p.price * qty}\n`;
    total += p.price * qty;
  });
  text += `\nTotal: ₹${total}\n\nProceed to checkout with the form below.`;
  alert(text);
});

// initial render
document.getElementById("upi-id-text").innerText = CONFIG.upi_id;
renderProducts();
renderMostSelling();
updateCartCount();