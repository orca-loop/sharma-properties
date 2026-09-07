# Sharma Property — Website

A static website (Home, Listings, List Your Property, contact details
throughout) that pulls its property listings live from a **Google Sheet**,
which is filled by a **Google Form**. No database, no server, no monthly
cost — still hosted for free — but listings are now added by anyone
submitting the form, and only go public once you mark them **Approved**.

## How it works

```
 Visitor fills in         Answers land in a         Website reads the
 the Google Form   ──▶    Google Sheet tab   ──▶    Sheet and shows only
 ("List Your                (one new row              rows marked
  Property")                 per submission)           "Approved"
```

- Nobody can edit the Listings page itself — it only *displays* what's in
  the Sheet. There's no "edit" button on the site anywhere.
- New submissions sit as **Pending** (or blank) until you review them.
- The moment you type **Approved** in the Status column, that listing
  appears on the site — visitors just need to refresh the page.
- Type **Rejected** (or leave it blank) and it simply never shows up.

## Files

```
index.html              → Home page
listings.html            → Full listings page with filters and search
add-listing.html          → "List Your Property" page — embeds the Google Form
css/style.css             → All styling
js/sheet-config.js        → THE FILE YOU EDIT — your Sheet ID + Form link
js/sheet-loader.js        → Fetches & parses the Sheet (no need to touch)
js/main.js                → Site logic — rendering, filters, modal (no need to touch)
```

---

## Setup — do this once

### 1. Create the Google Form

Go to [forms.google.com](https://forms.google.com) → new blank form. Add
these questions, in this order, using these exact types:

| # | Question | Type |
|---|----------|------|
| 1 | Your Name | Short answer |
| 2 | Phone Number (WhatsApp preferred) | Short answer |
| 3 | Property Title | Short answer |
| 4 | Category | Dropdown — options: `Residential`, `Commercial`, `Industrial` |
| 5 | Purpose | Dropdown — options: `Sale`, `Rent` |
| 6 | Price | Short answer (e.g. `₹68,00,000` or `₹18,000`) |
| 7 | Price Note (for rentals only — e.g. /month. Leave blank for sale) | Short answer |
| 8 | Area | Short answer (e.g. `1450 sq.ft.`) |
| 9 | Locality / Address | Short answer |
| 10 | Description | Paragraph |
| 11 | Tags (optional, comma separated — e.g. Parking, Ready to Move) | Short answer |
| 12 | Photo Links (paste one link per line — see note below) | Paragraph |

You can reword the questions slightly if you like (add "(required)", fix
punctuation, etc.) — the site matches columns by keyword, not exact text.
Just keep the *topic* of each question the same and in this rough order.

**About photo links (question 12):** the site can't accept uploaded files
directly (no server to store them on), so ask for links instead:
- **Easiest & most reliable:** upload photos to [postimages.org](https://postimages.org)
  or [imgur.com](https://imgur.com) (no account needed) and paste the
  **direct image link** they give you.
- **Google Drive also works**, if the file is shared as "Anyone with the
  link" — paste the normal share link and the site converts it
  automatically.
- Multiple photos: one link per line.

### 2. Link the Form to a Sheet

In the Form editor, click the **Responses** tab → the green Sheets icon →
**Create a new spreadsheet**. This creates a Google Sheet with a tab
(usually named `Form Responses 1`) that fills up automatically as people
submit the form.

### 3. Add a Status column

Open that Sheet. In the first empty column to the right of your last
question, add a header: **Status**.

- Leave a submission's Status cell blank (or type `Pending`) to keep it
  hidden.
- Type **Approved** to publish it on the website.
- Type **Rejected** to keep it hidden permanently.

Tip: select the whole Status column → **Data → Data validation** → list of
items → `Pending, Approved, Rejected` — this turns it into a dropdown so
you can't mistype it.

### 4. Share the Sheet so the website can read it

Click **Share** (top right of the Sheet) → **Change to anyone with the
link** → make sure the role is **Viewer** → Done. This lets the website
*read* the data — nobody can edit the Sheet without being added as an
editor separately, and the Listings page on your site has no editing
controls at all.

### 5. Get your Sheet ID and connect it

Copy the long ID from the Sheet's URL:

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit
                                        └──────────────── this part ────────────┘
```

Open `js/sheet-config.js` in any text editor and paste it in:

```js
SHEET_ID: "1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
SHEET_NAME: "Form Responses 1",   // match the tab name at the bottom of your Sheet
```

### 6. Get your Form link and connect it

In the Form editor, click **Send** → the link icon (🔗) → copy the link.
Paste it into the same file:

```js
GOOGLE_FORM_URL: "https://docs.google.com/forms/d/e/xxxxxxxx/viewform",
```

Save the file. That's the only file you need to edit.

### 7. Test it

Open `listings.html` in a browser (or re-host the folder). Submit a test
entry through the form, mark it **Approved** in the Sheet, refresh the
Listings page — it should appear. Try `add-listing.html` too and confirm
the form loads inline.

---

## Hosting it for free (pick one)

**Netlify Drop (easiest, 2 minutes)**
1. Go to https://app.netlify.com/drop
2. Drag the whole `sharma-property` folder onto the page.
3. You get a live URL immediately (e.g. `random-name.netlify.app`).
4. Add a custom domain later from the Netlify dashboard — still free.

**GitHub Pages (best if you'll update the site's design often)**
1. Create a free GitHub account and a new repository.
2. Upload all these files/folders to it.
3. Settings → Pages → set source to the main branch.
4. Live at `yourusername.github.io/repo-name`.

**Vercel** works the same way — drag-and-drop deploy, free tier.

Note: because listings now live in the Sheet (not a file in the site),
you generally *never need to re-upload/re-deploy* just to add or approve
a listing — only the Status cell in the Sheet changes.

## Filtering by property type

The Listings page already filters by **Residential / Commercial /
Industrial** and by **Sale / Rent**, plus a text search box — this
carried over unchanged. The Home page's "What we handle" tiles link
straight into a filtered view (e.g. clicking "Residential" opens
Listings pre-filtered to Residential).

## Troubleshooting

- **"Couldn't load listings right now"** on the site — usually means
  `SHEET_ID` or `SHEET_NAME` in `js/sheet-config.js` is wrong, or the
  Sheet's share setting isn't "Anyone with the link – Viewer". Double
  check both.
- **A listing won't show up** — check its Status cell says exactly
  `Approved` (not `approved ` with a trailing space, not `Aproved`).
  The dropdown from step 3 avoids this.
- **A photo won't display** — the link either isn't a direct image URL,
  or (for Google Drive) the file isn't shared publicly. Re-check the
  sharing setting on that specific file, or switch to postimages.org/imgur.

## Contact details on the site

The WhatsApp button and phone/email links use the number and address
already on file: +91 62610 02293 / adarshsharmaji751@gmail.com / Blue
Water Park Road, Neer Nagar, Indore. Update these directly in the HTML
files (search for the phone number) if they ever change.
