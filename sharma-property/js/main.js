/* ==========================================================
   SHARMA PROPERTY — SITE LOGIC
   Reads from LISTINGS, loaded live from the Google Sheet by
   js/sheet-loader.js, and renders cards.
   ========================================================== */

// Line-drawing placeholder graphic used when a listing has no
// photos, styled per category.
function placeholderMedia(listing) {
  const lines = {
    Residential: `<path d="M20 85 L20 45 L60 20 L100 45 L100 85 Z" stroke="#C99A52" stroke-width="1.5" fill="none"/><rect x="52" y="60" width="16" height="25" stroke="#C99A52" stroke-width="1.5" fill="none"/>`,
    Commercial: `<rect x="18" y="30" width="84" height="55" stroke="#C99A52" stroke-width="1.5" fill="none"/><line x1="18" y1="46" x2="102" y2="46" stroke="#C99A52" stroke-width="1"/><line x1="40" y1="30" x2="40" y2="85" stroke="#C99A52" stroke-width="1"/><line x1="80" y1="30" x2="80" y2="85" stroke="#C99A52" stroke-width="1"/>`,
    Industrial: `<path d="M15 85 L15 55 L35 65 L35 45 L55 55 L55 40 L75 50 L95 40 L95 85 Z" stroke="#C99A52" stroke-width="1.5" fill="none"/>`
  };
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">${lines[listing.category] || lines.Residential}</svg>`;
}

// Card media: the listing's first photo if it has one, otherwise
// the line-drawing placeholder.
function buildCardMedia(listing) {
  if (listing.photos && listing.photos.length) {
    return `<img src="${listing.photos[0]}" alt="${listing.title}" loading="lazy">`;
  }
  return placeholderMedia(listing);
}

function cardHTML(listing) {
  return `
    <article class="card" data-id="${listing.id}" tabindex="0" role="button" aria-label="View details for ${listing.title}">
      <div class="card-media">
        <span class="card-tag ${listing.purpose}">For ${listing.purpose}</span>
        ${buildCardMedia(listing)}
      </div>
      <div class="card-body">
        <div class="card-cat">${listing.category}</div>
        <h3>${listing.title}</h3>
        <div class="card-locality">${listing.locality}</div>
        <div class="card-price">${listing.price}${listing.priceNote ? `<small> ${listing.priceNote}</small>` : ""}</div>
        <div class="card-area">${listing.area}</div>
      </div>
    </article>`;
}

function renderGrid(container, list) {
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<div class="empty-state">No listings match these filters right now. Try a different combination, or check back soon — new listings are added regularly.</div>`;
    return;
  }
  container.innerHTML = list.map(cardHTML).join("");
}

function attachCardClicks(container) {
  if (!container) return;
  container.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openModal(Number(card.dataset.id));
  });
  container.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const card = e.target.closest(".card");
      if (card) openModal(Number(card.dataset.id));
    }
  });
}

/* ---------- Modal ---------- */
function openModal(id) {
  const listing = LISTINGS.find((l) => l.id === id);
  if (!listing) return;
  const overlay = document.getElementById("listing-modal");
  if (!overlay) return;
  const mediaEl = overlay.querySelector(".modal-media");
  const thumbsEl = overlay.querySelector(".modal-thumbs");
  const photos = listing.photos && listing.photos.length ? listing.photos : null;

  function showPhoto(src) {
    mediaEl.innerHTML = `<img src="${src}" alt="${listing.title}">`;
  }

  if (photos) {
    showPhoto(photos[0]);
    if (photos.length > 1 && thumbsEl) {
      thumbsEl.innerHTML = photos
        .map((src, i) => `<img src="${src}" data-i="${i}" class="${i === 0 ? "active" : ""}">`)
        .join("");
      thumbsEl.style.display = "flex";
      thumbsEl.onclick = (e) => {
        const img = e.target.closest("img");
        if (!img) return;
        showPhoto(photos[Number(img.dataset.i)]);
        thumbsEl.querySelectorAll("img").forEach((t) => t.classList.remove("active"));
        img.classList.add("active");
      };
    } else if (thumbsEl) {
      thumbsEl.style.display = "none";
      thumbsEl.innerHTML = "";
    }
  } else {
    mediaEl.innerHTML = placeholderMedia(listing);
    if (thumbsEl) { thumbsEl.style.display = "none"; thumbsEl.innerHTML = ""; }
  }

  overlay.querySelector(".modal-cat").textContent = `${listing.category} · For ${listing.purpose}`;
  overlay.querySelector(".modal-title").textContent = listing.title;
  overlay.querySelector(".modal-locality").textContent = listing.locality;
  overlay.querySelector(".modal-price").innerHTML = `${listing.price}${listing.priceNote ? ` <small style="font-size:0.9rem;color:var(--ink-soft);font-family:'Work Sans',sans-serif;">${listing.priceNote}</small>` : ""}`;
  overlay.querySelector(".modal-area").textContent = listing.area;
  overlay.querySelector(".modal-desc").textContent = listing.description;
  overlay.querySelector(".modal-tags").innerHTML = listing.tags.map((t) => `<span>${t}</span>`).join("");
  overlay.querySelector(".modal-contact-note").textContent = listing.contactNote || "";
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("listing-modal");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

let LISTINGS = [];

document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // Modal close handlers
  const overlay = document.getElementById("listing-modal");
  if (overlay) {
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  const featuredGrid = document.getElementById("featured-grid");
  const allGrid = document.getElementById("all-listings-grid");
  if (!featuredGrid && !allGrid) return; // page has no listings to load (e.g. add-listing.html)

  const loadingHTML = `<div class="empty-state">Loading listings…</div>`;
  const errorHTML = `<div class="empty-state is-error">Couldn't load listings right now. Please refresh the page, or message us on WhatsApp and we'll send details directly.</div>`;
  if (featuredGrid) featuredGrid.innerHTML = loadingHTML;
  if (allGrid) allGrid.innerHTML = loadingHTML;

  loadListings()
    .then((list) => {
      LISTINGS = list;

      if (featuredGrid) {
        renderGrid(featuredGrid, LISTINGS.slice(0, 3));
        attachCardClicks(featuredGrid);
      }

      if (allGrid) {
        let activeCategory = new URLSearchParams(location.search).get("category") || "All";
        let activePurpose = "All";
        let searchTerm = "";

        function applyFilters() {
          let list = LISTINGS.filter((l) => {
            const catMatch = activeCategory === "All" || l.category === activeCategory;
            const purMatch = activePurpose === "All" || l.purpose === activePurpose;
            const term = searchTerm.trim().toLowerCase();
            const searchMatch = !term ||
              l.title.toLowerCase().includes(term) ||
              l.locality.toLowerCase().includes(term) ||
              l.tags.join(" ").toLowerCase().includes(term);
            return catMatch && purMatch && searchMatch;
          });
          renderGrid(allGrid, list);
          const countEl = document.getElementById("results-count");
          if (countEl) countEl.textContent = `${list.length} listing${list.length === 1 ? "" : "s"} found`;
        }

        document.querySelectorAll("[data-filter-category]").forEach((btn) => {
          if (btn.dataset.filterCategory === activeCategory) {
            document.querySelectorAll("[data-filter-category]").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
          }
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-filter-category]").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategory = btn.dataset.filterCategory;
            applyFilters();
          });
        });

        document.querySelectorAll("[data-filter-purpose]").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-filter-purpose]").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            activePurpose = btn.dataset.filterPurpose;
            applyFilters();
          });
        });

        const searchInput = document.getElementById("listing-search");
        if (searchInput) {
          searchInput.addEventListener("input", (e) => {
            searchTerm = e.target.value;
            applyFilters();
          });
        }

        attachCardClicks(allGrid);
        applyFilters();
      }
    })
    .catch((err) => {
      console.error(err);
      if (featuredGrid) featuredGrid.innerHTML = errorHTML;
      if (allGrid) allGrid.innerHTML = errorHTML;
    });
});

/* ---------- Cinematic property story ---------- */
function initPropertyStory() {
  const story = document.querySelector('.property-story');
  if (!story) return;
  const images = [...story.querySelectorAll('.property-story__image')];
  const kicker = story.querySelector('#story-kicker');
  const title = story.querySelector('#story-title');
  const text = story.querySelector('#story-text');
  const cta = story.querySelector('#story-cta');
  const progress = story.querySelector('.property-story__progress span');
  if (!images.length || !kicker || !title || !text) return;

  const copy = [
    ['ACROSS INDORE', 'Every space says something first.', 'Sharma Property works across residential, commercial and industrial space — flats and plots, shops and showrooms, warehouses and godowns.'],
    ['WHAT MATTERS INSIDE', 'The details decide what works.', 'Layout, light, parking, power load, existing tenancy — the practical questions get answered before you\u2019re asked to decide anything.'],
    ['READY WHEN YOU ARE', 'See what\u2019s ready right now.', 'Current listings for sale and rent, reviewed and kept up to date.']
  ];

  let last = -1;
  function updateStory() {
    const rect = story.getBoundingClientRect();
    const max = Math.max(1, story.offsetHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, -rect.top / max));
    const raw = p * (images.length - 0.001);
    const index = Math.min(images.length - 1, Math.floor(raw));
    const local = raw - index;

    images.forEach((img, i) => {
      const distance = Math.abs(i - raw);
      const opacity = Math.max(0, 1 - distance * 1.7);
      img.style.opacity = opacity.toFixed(3);
      img.style.transform = `scale(${(1.08 - Math.min(.06, Math.max(0, opacity) * .06)).toFixed(3)})`;
      img.style.zIndex = i === index ? 2 : 1;
    });
    if (progress) progress.style.height = `${Math.max(8, p * 100)}%`;

    if (index !== last) {
      last = index;
      kicker.textContent = copy[index][0];
      title.textContent = copy[index][1];
      text.textContent = copy[index][2];
      if (cta) cta.classList.toggle('is-visible', index === images.length - 1);
    }
  }
  updateStory();
  window.addEventListener('scroll', updateStory, { passive: true });
  window.addEventListener('resize', updateStory);
}

document.addEventListener('DOMContentLoaded', initPropertyStory);
