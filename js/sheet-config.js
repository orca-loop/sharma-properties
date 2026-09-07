/* ============================================================
   SHARMA PROPERTY — GOOGLE SHEET / FORM CONFIG
   ============================================================
   This is the ONLY file you should need to edit to connect the
   website to your own Google Sheet + Google Form. Everything
   else (fetching, parsing, filtering to Approved rows) is
   handled automatically by js/sheet-loader.js.

   See README.md → "Google Form + Sheet setup" for the full
   step-by-step, including exactly which fields to put in the
   Form and how to find each value below.
   ============================================================ */

const SHEET_CONFIG = {
  // The long ID from your Google Sheet's URL, e.g.:
  // https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit
  //                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ this part
  SHEET_ID: "PASTE_YOUR_GOOGLE_SHEET_ID_HERE",

  // The name of the TAB inside the Sheet that holds the Form
  // responses. Google Forms creates this automatically and
  // usually calls it "Form Responses 1" — check the tab name
  // at the bottom of your Sheet and match it exactly here.
  SHEET_NAME: "Form Responses 1",

  // The public "fill out this form" link for your Google Form.
  // Form → top-right "Send" button → the link (🔗) icon → copy.
  GOOGLE_FORM_URL: "PASTE_YOUR_GOOGLE_FORM_LINK_HERE",

  // Same link as above, but with "?embedded=true" added at the
  // end (or "&embedded=true" if the link already has a "?" in
  // it). This is what lets the form show up directly inside the
  // "List Your Property" page instead of only opening in a new
  // tab. Leave as-is — it's built from GOOGLE_FORM_URL below.
  get GOOGLE_FORM_EMBED_URL() {
    if (!this.GOOGLE_FORM_URL || this.GOOGLE_FORM_URL.startsWith("PASTE_")) return "";
    const sep = this.GOOGLE_FORM_URL.includes("?") ? "&" : "?";
    return `${this.GOOGLE_FORM_URL}${sep}embedded=true`;
  },
};
