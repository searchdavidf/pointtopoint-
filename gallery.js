/* =========================================================
   POINT TO POINT — shared cart engine
   Used by every category page. Each page loads its own
   *-data.js file (defining PAGE_TITLE and SAMPLES) BEFORE
   this script. Nothing here is page-specific.

   The cart persists in localStorage so a customer can browse
   Fabrication, then Signage, then Art, and everything they
   picked is still there when they open the cart at the end.
========================================================= */
const WHATSAPP_NUMBER = '971562293410';       // digits only, no +
const CONTACT_EMAIL = 'info@pointtopointind.com';

const CART_KEY = 'ptp_cart_v1';
const FORM_KEY = 'ptp_cart_form_v1';

function ptpGetCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function ptpSetCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable, cart just won't persist */ }
}
function ptpGetForm() {
  try { return JSON.parse(localStorage.getItem(FORM_KEY)) || {}; }
  catch (e) { return {}; }
}
function ptpSetForm(data) {
  try { localStorage.setItem(FORM_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

(function () {
  const grid = document.getElementById('sample-grid');
  if (!grid) return; // script included on a page without a gallery

  const emptyMsg = document.getElementById('sample-empty');
  const filterRow = document.querySelector('.filter-row');

  const fab = document.getElementById('cart-fab');
  const fabCount = document.getElementById('cart-fab-count');
  const modal = document.getElementById('cart-modal');
  const backdrop = document.getElementById('cart-modal-backdrop');
  const closeBtn = document.getElementById('cart-close');
  const itemsWrap = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');

  const nameInput = document.getElementById('cart-name');
  const locationInput = document.getElementById('cart-location');
  const contactInput = document.getElementById('cart-contact');
  const notesInput = document.getElementById('cart-notes');

  let activeFilter = 'all';

  /* ---------- restore any in-progress form draft ---------- */
  const savedForm = ptpGetForm();
  if (savedForm.name) nameInput.value = savedForm.name;
  if (savedForm.location) locationInput.value = savedForm.location;
  if (savedForm.contact) contactInput.value = savedForm.contact;
  if (savedForm.notes) notesInput.value = savedForm.notes;

  [nameInput, locationInput, contactInput, notesInput].forEach(el => {
    el.addEventListener('input', () => {
      ptpSetForm({
        name: nameInput.value,
        location: locationInput.value,
        contact: contactInput.value,
        notes: notesInput.value,
      });
    });
  });

  /* ---------- placeholder for missing photos ---------- */
  function placeholderSrc(label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
      <rect width="100%" height="100%" fill="#23282F"/>
      <text x="50%" y="50%" fill="#8B95A1" font-family="monospace" font-size="16"
        text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function isInCart(id) {
    return ptpGetCart().some(item => item.id === id);
  }

  /* ---------- sample grid ---------- */
  function renderGrid() {
    grid.innerHTML = '';
    const visible = SAMPLES.filter(s => activeFilter === 'all' || s.material === activeFilter);
    emptyMsg.hidden = visible.length > 0;

    visible.forEach(s => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sample-card';
      card.dataset.id = s.id;
      const selected = isInCart(s.id);
      card.setAttribute('aria-pressed', selected ? 'true' : 'false');
      if (selected) card.classList.add('is-selected');

      card.innerHTML = `
        <span class="sample-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <img class="sample-image" src="${s.file}" alt="${s.label} — ${s.material}" loading="lazy"
             onerror="this.onerror=null; this.src='${placeholderSrc(s.label)}';">
        <span class="sample-label">${s.label}</span>
        <span class="sample-material">${s.material}</span>
      `;

      card.addEventListener('click', () => toggleCart(s));
      grid.appendChild(card);
    });
  }

  function toggleCart(sample) {
    const cart = ptpGetCart();
    const idx = cart.findIndex(item => item.id === sample.id);
    if (idx > -1) {
      cart.splice(idx, 1);
    } else {
      cart.push({ id: sample.id, label: sample.label, material: sample.material, category: PAGE_TITLE });
    }
    ptpSetCart(cart);
    renderGrid();
    updateFabCount();
    if (!modal.hidden) renderCartItems();
  }

  /* ---------- filters ---------- */
  filterRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    filterRow.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('is-active', c === chip));
    renderGrid();
  });

  /* ---------- cart button + modal ---------- */
  function updateFabCount() {
    const count = ptpGetCart().length;
    fabCount.textContent = count;
    fabCount.hidden = count === 0;
  }

  function renderCartItems() {
    const cart = ptpGetCart();
    itemsWrap.innerHTML = '';
    cartEmpty.hidden = cart.length > 0;

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-label">${item.label}</span>
          <span class="cart-item-meta">${item.category} &middot; ${item.material}</span>
        </div>
        <button type="button" class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${item.label}">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      `;
      itemsWrap.appendChild(row);
    });

    itemsWrap.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const cart = ptpGetCart().filter(item => item.id !== btn.dataset.id);
        ptpSetCart(cart);
        renderCartItems();
        renderGrid();
        updateFabCount();
      });
    });
  }

  function openModal() {
    modal.hidden = false;
    renderCartItems();
  }
  function closeModal() {
    modal.hidden = true;
  }

  fab.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* ---------- message building ----------
     channel: 'whatsapp' | 'email'
     WhatsApp renders *asterisks* as bold, so we use them there.
     Email (mailto body) is plain text — no markdown, so headings
     stay unbolded but the structure (numbering, blank lines,
     divider) does the work instead.
  ---------------------------------------- */
  function buildMessage(channel) {
    const isWhatsApp = channel === 'whatsapp';
    const bold = (text) => (isWhatsApp ? `*${text}*` : text);

    const cart = ptpGetCart();
    const byCategory = {};
    cart.forEach(item => {
      (byCategory[item.category] = byCategory[item.category] || []).push(item);
    });

    const lines = [];
    lines.push(bold('NEW QUOTE REQUEST'));
    lines.push('Point to Point Metal Industries');
    lines.push('');

    Object.keys(byCategory).forEach(cat => {
      const items = byCategory[cat];
      lines.push(bold(`${cat} (${items.length})`));
      items.forEach((item, i) => lines.push(`${i + 1}. ${item.label} — ${item.material}`));
      lines.push('');
    });

    lines.push(`Total items: ${cart.length}`);
    lines.push('');
    lines.push('-------------------------');
    lines.push(bold('Contact Details'));

    const name = nameInput.value.trim();
    const location = locationInput.value.trim();
    const contact = contactInput.value.trim();
    const notes = notesInput.value.trim();
    if (name) lines.push(`Name: ${name}`);
    if (location) lines.push(`Location: ${location}`);
    if (contact) lines.push(`Contact: ${contact}`);
    if (notes) lines.push(`Notes: ${notes}`);

    return lines.join('\n').trim();
  }

  document.getElementById('send-whatsapp').addEventListener('click', () => {
    if (ptpGetCart().length === 0) return;
    const text = encodeURIComponent(buildMessage('whatsapp'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener');
  });

  document.getElementById('send-email').addEventListener('click', () => {
    if (ptpGetCart().length === 0) return;
    const subject = encodeURIComponent('Sample Enquiry — Point to Point');
    const body = encodeURIComponent(buildMessage('email'));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });

  renderGrid();
  updateFabCount();
})();
