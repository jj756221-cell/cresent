# Crescent Public School Magazine — Reference-inspired demo

A responsive Crescent Public School magazine landing page using a colourful reference-inspired design. It includes 12 topic cards, a quote panel, and a PDF-based digital reader with animated page turning. Replace sample content with verified school details and approved photos before publishing.

## Run locally

1. Extract this ZIP.
2. Open a terminal in the extracted `unizon-magazine` folder.
3. Run `python -m http.server 8000`.
4. Open `http://localhost:8000` in your browser.

If you already started the server from the parent `BookFlip` folder, use `http://localhost:8000/unizon-magazine/` instead.

## Flipbook

Use **Read the issue**, **Open the magazine**, or **Start reading** to open the reader. The reader loads `assets/sample-magazine.pdf`, renders its pages using PDF.js, and uses StPageFlip for the page-turning interaction. Use the PDF controls to open another local PDF, navigate pages, zoom, and enter fullscreen. Internet access is required for the PDF.js and StPageFlip CDN libraries.

## Important content note

The linked reference site is used as a design/content-structure reference. This package does not include or claim to reproduce the original site's complete magazine PDF, original photos, or unpublished material. The included 13-page PDF is clearly marked sample/demo content. Replace `assets/sample-magazine.pdf` with an official PDF you are authorised to use, keeping the filename the same, to show the real magazine pages in the flipbook.

## Main files

- `index.html` — homepage, 12 magazine sections, quote, reader controls.
- `css/styles.css` — responsive layout and styling.
- `js/app.js` — PDF loading, PDF rendering, flipbook, thumbnails, navigation and zoom.
- `assets/sample-magazine.pdf` — demo PDF, replace with authorised official PDF when available.

See `docs/TESTING.md` for a quick manual test checklist.
