/* ============================================================
   SHARMA PROPERTY — SHEET LOADER
   ============================================================
   Pulls rows from the Google Sheet tab named in sheet-config.js,
   keeps only rows whose Status column says "Approved", and turns
   them into the same listing objects the site used to keep in
   js/listings-data.js — so nothing else in main.js has to change.

   You should not need to edit this file. Everything site-owner-
   specific lives in js/sheet-config.js.
   ============================================================ */

/**
 * Header-name matching is intentionally fuzzy: it looks for a
 * keyword inside the (lower-cased, stripped-of-punctuation)
 * column header rather than requiring an exact title. That way
 * small edits to the Google Form question text (capitalisation,
 * punctuation, adding "(required)", etc.) don't break the site.
 */
const HEADER_RULES = [
  { field: "status", keywords: ["status"] },
  { field: "title", keywords: ["propertytitle", "title", "propertyname"] },
  { field: "category", keywords: ["category", "propertytype"] },
  { field: "purpose", keywords: ["purpose", "saleorrent", "salerent"] },
  { field: "priceNote", keywords: ["pricenote", "notepriceonly", "note"] },
  { field: "price", keywords: ["price"] },
  { field: "area", keywords: ["area", "sqft", "size"] },
  { field: "locality", keywords: ["locality", "address", "location"] },
  { field: "description", keywords: ["description"] },
  { field: "tags", keywords: ["tags", "features", "amenities"] },
  { field: "photos", keywords: ["photo", "image", "picture"] },
  { field: "contactPhone", keywords: ["phone", "mobile", "whatsapp", "contactnumber"] },
  { field: "contactEmail", keywords: ["email"] },
  { field: "contactName", keywords: ["yourname", "name", "ownername"] },
  { field: "timestamp", keywords: ["timestamp"] },
];

function normalizeHeader(h) {
  return (h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchField(header) {
  const norm = normalizeHeader(header);
  for (const rule of HEADER_RULES) {
    if (rule.keywords.some((kw) => norm.includes(kw))) return rule.field;
  }
  return null;
}

function normalizeCategory(raw) {
  const v = (raw || "").toLowerCase();
  if (v.includes("resid")) return "Residential";
  if (v.includes("commerc")) return "Commercial";
  if (v.includes("indust")) return "Industrial";
  return raw ? raw.trim() : "Residential";
}

function normalizePurpose(raw) {
  const v = (raw || "").toLowerCase();
  return v.includes("rent") ? "Rent" : "Sale";
}

/** Converts a common Google Drive "share" link into a link that
 *  actually renders as an image, when possible. Leaves any other
 *  URL (imgur, postimages, etc.) untouched. */
function toDirectImageUrl(url) {
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = driveFileMatch ? driveFileMatch[1] : (url.includes("drive.google.com") && driveIdMatch ? driveIdMatch[1] : null);
  if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
  return url;
}

function parsePhotos(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .map(toDirectImageUrl);
}

function parseTags(raw) {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildContactNote(row) {
  const parts = [];
  if (row.contactName) parts.push(`Ask for ${row.contactName}`);
  if (row.contactPhone) parts.push(row.contactPhone);
  return parts.length ? parts.join(" · ") : "Ask for Adarsh Sharma";
}

function rowsToListings(rows) {
  const approved = rows.filter(
    (r) => (r.status || "").trim().toLowerCase() === "approved"
  );

  // Newest first: use the Timestamp column if present, otherwise
  // just reverse (Sheets appends new Form responses at the bottom).
  const hasTimestamps = approved.some((r) => r.timestamp);
  const ordered = hasTimestamps
    ? [...approved].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [...approved].reverse();

  return ordered.map((r, i) => ({
    id: i + 1,
    title: r.title || "Untitled property",
    category: normalizeCategory(r.category),
    purpose: normalizePurpose(r.purpose),
    price: r.price || "Price on request",
    priceNote: r.priceNote || "",
    area: r.area || "",
    locality: r.locality || "",
    description: r.description || "",
    tags: parseTags(r.tags),
    photos: parsePhotos(r.photos),
    contactNote: buildContactNote(r),
  }));
}

function sheetCsvUrl() {
  const { SHEET_ID, SHEET_NAME } = SHEET_CONFIG;
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
}

/**
 * Fetches and parses the sheet. Returns an array of listing
 * objects (Approved rows only). Throws if the config hasn't been
 * filled in yet, or the fetch/parse fails, so callers can show an
 * error state instead of a silently empty page.
 */
async function loadListings() {
  if (!SHEET_CONFIG.SHEET_ID || SHEET_CONFIG.SHEET_ID.startsWith("PASTE_")) {
    throw new Error("Sheet not configured yet — set SHEET_ID in js/sheet-config.js");
  }

  const res = await fetch(sheetCsvUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not reach the Google Sheet (HTTP ${res.status})`);
  const csvText = await res.text();

  const parsed = Papa.parse(csvText.trim(), { skipEmptyLines: true });
  const [headerRow, ...dataRows] = parsed.data;
  if (!headerRow) return [];

  const fieldForColumn = headerRow.map(matchField);

  const rows = dataRows.map((cols) => {
    const row = {};
    cols.forEach((val, i) => {
      const field = fieldForColumn[i];
      if (field) row[field] = (val || "").trim();
    });
    return row;
  });

  return rowsToListings(rows);
}
