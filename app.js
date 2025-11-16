const API_BASE = "https://YOUR_BACKEND_URL_OR_LOCALHOST:PORT"; // replace before deploy (see README)

// local cart
let cart = {};
function updateCartUI(){
  const count = Object.values(cart).reduce((s,v)=>s+v.qty,0);
  document.getElementById('cart-count').innerText = count;
}
function addToCart(product){
  if(cart[product.id]) cart[product.id].qty++;
  else cart[product.id] = {...product, qty:1};
  updateCartUI();
}

async function loadInventory(){
  try{
    const res = await fetch(`${API_BASE}/api/inventory`);
    const arr = await res.json();
    renderInventory(arr);
    renderMostSelling(arr);
  }catch(err){
    console.error(err);
    document.getElementById('inventory').innerHTML = `<div class="alert alert-danger">Cannot load inventory. Is backend running?</div>`;
  }
}

function renderInventory(items){
  const container = document.getElementById('inventory');
  container.innerHTML = '';
  items.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'col-sm-6 col-lg-4';
    card.innerHTML = `
      <div class="card product-card">
        <img src="${p.image||'https://via.placeholder.com/400x200?text=Bird+House'}" class="card-img-top card-img" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name} ${p.sold>5?'<span class="badge bg-success">Hot</span>':''}</h5>
          <p class="card-text">${p.description || ''}</p>
          <div class="mt-auto">
            <p class="mb-1"><strong>₹${p.price}</strong></p>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-primary" onclick='addToCart(${JSON.stringify(p)})'>Add to cart</button>
              <button class="btn btn-sm btn-outline-secondary" onclick='buyNow(${JSON.stringify(p)})'>Buy now</button>
            </div>
          </div>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function renderMostSelling(items){
  const list = document.getElementById('most-selling');
  const top = items.slice().sort((a,b)=>b.sold-a.sold).slice(0,5);
  list.innerHTML = top.map(t=>`<li>${t.name} — sold ${t.sold}</li>`).join('');
}

// buy now shortcut
function buyNow(p){
  cart = {};
  cart[p.id] = {...p, qty:1};
  updateCartUI();
  window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
}

// order form
document.getElementById('order-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(Object.keys(cart).length===0){ alert('Cart is empty'); return; }
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();

  const order = {
    name, phone, address,
    items: Object.values(cart).map(i=>({id:i.id, name:i.name, qty:i.qty, price:i.price})),
    total: Object.values(cart).reduce((s,i)=>s + i.qty*i.price,0)
  };

  try{
    const res = await fetch(`${API_BASE}/api/orders`, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify(order)
    });
    const saved = await res.json();
    document.getElementById('order-result').innerHTML = `<div class="alert alert-success">Order placed! Order ID: <strong>${saved.id}</strong>. Please scan the QR to pay or use the payment link below.</div>
      <p>Payment link: <a target="_blank" href="${saved.payment_link}">${saved.payment_link}</a></p>`;
    cart = {}; updateCartUI();
  }catch(err){
    console.error(err);
    document.getElementById('order-result').innerHTML = `<div class="alert alert-danger">Failed to place order</div>`;
  }
});

// map (OpenStreetMap via Leaflet)
function initMap(){
  const mapEl = document.getElementById('map');
  const map = L.map(mapEl).setView([34.275, 74.444], 13); // default Sopore-ish coords; replace if necessary
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  L.marker([34.275,74.444]).addTo(map).bindPopup('Sopore Bird House').openPopup();
}

// payment QR: uses qrserver API (no key). Backend returns a payment_link we can use.
function updatePaymentQR(paymentLink){
  const img = document.getElementById('payment-qr');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentLink)}`;
  img.src = qrUrl;
}

async function init(){
  initMap();
  // load inventory + get a sample payment link from backend
  try{
    const res = await fetch(`${API_BASE}/api/info`);
    const info = await res.json();
    if(info.payment_link) updatePaymentQR(info.payment_link);
  }catch(e){ console.warn('info fetch failed', e); }
  await loadInventory();
  updateCartUI();
}

init();