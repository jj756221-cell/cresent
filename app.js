(() => {
  const $ = (id) => document.getElementById(id);
  const reader = $('reader'), host = $('bookHost'), status = $('bookStatus'), errorBox = $('readerError');
  const pdfInputs = [$('pdfInput'), $('readerPdfInput')];
  let pageFlip = null, pdfjs = null, pageCount = 0, currentPage = 0, zoom = 1, pageImages = [], pdfObjectUrl = null, isLoading = false;
  const MAX_PDF_MB = 50, MAX_RENDER_PAGES = 120, BASE_WIDTH = 420, BASE_HEIGHT = 560;

  $('year').textContent = new Date().getFullYear();
  $('menuToggle').addEventListener('click', () => {
    const open = $('navLinks')?.classList.toggle('open');
    $('menuToggle').setAttribute('aria-expanded', String(Boolean(open)));
  });
  // Navigation is intentionally graceful if the optional nav ID is not present.
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('open')));
  const toast = (message) => { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600); };
  const showStatus = (message, visible = true) => { status.textContent = message; status.classList.toggle('hidden', !visible); };
  const showError = (message) => { errorBox.textContent = message; errorBox.hidden = false; showStatus('', false); };
  const clearError = () => { errorBox.hidden = true; errorBox.textContent = ''; };

  async function getPdfJs() {
    if (pdfjs) return pdfjs;
    pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    return pdfjs;
  }

  function openReader() {
    reader.classList.add('is-open'); reader.setAttribute('aria-hidden', 'false'); document.body.classList.add('reader-active');
    if (!pageFlip && !isLoading) loadPdf('assets/sample-magazine.pdf', 'Crescent Public School · Sample issue');
  }
  function closeReader() {
    reader.classList.remove('is-open'); reader.setAttribute('aria-hidden', 'true'); document.body.classList.remove('reader-active');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }
  $('openReaderTop').addEventListener('click', openReader);
  $('openReaderHero').addEventListener('click', openReader);
  $('openReaderPromo').addEventListener('click', openReader);
  $('closeReader').addEventListener('click', closeReader);
  $('returnHome').addEventListener('click', closeReader);
  reader.addEventListener('click', e => { if (e.target === reader) closeReader(); });
  document.addEventListener('keydown', e => {
    if (!reader.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeReader(); return; }
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
    if (e.key === 'ArrowRight') turnNext();
    if (e.key === 'ArrowLeft') turnPrev();
    if (e.key === 'Home') turnTo(0);
    if (e.key === 'End') turnTo(pageCount - 1);
  });
  $('fullscreenBtn').addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await reader.requestFullscreen(); else await document.exitFullscreen(); }
    catch { toast('Fullscreen is not available in this browser.'); }
  });

  pdfInputs.forEach(input => input.addEventListener('change', async e => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { toast('Please choose a PDF file.'); return; }
    if (file.size > MAX_PDF_MB * 1024 * 1024) { toast(`PDF is too large. Maximum size is ${MAX_PDF_MB} MB.`); return; }
    openReader();
    if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    pdfObjectUrl = URL.createObjectURL(file);
    await loadPdf(pdfObjectUrl, `${file.name} · Local PDF`);
  }));

  async function loadPdf(source, subtitle) {
    if (isLoading) return;
    isLoading = true; clearError(); showStatus('Loading PDF engine…');
    try {
      const lib = await getPdfJs();
      showStatus('Opening magazine…');
      const loadingTask = lib.getDocument({ url: source, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      if (!pdf.numPages) throw new Error('This PDF does not contain any readable pages.');
      if (pdf.numPages > MAX_RENDER_PAGES) throw new Error(`This PDF has ${pdf.numPages} pages. For this demo, please use a PDF with ${MAX_RENDER_PAGES} pages or fewer.`);
      showStatus(`Rendering ${pdf.numPages} pages…`);
      const rendered = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        showStatus(`Rendering page ${n} of ${pdf.numPages}…`);
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        rendered.push(canvas.toDataURL('image/jpeg', .88));
        canvas.width = 0; canvas.height = 0;
      }
      pageImages = rendered;
      $('readerSubtitle').textContent = subtitle;
      initialiseFlipbook(rendered);
      buildThumbnails(rendered);
      showStatus('', false); $('totalPages').textContent = String(rendered.length);
      toast(`Magazine ready · ${rendered.length} pages`);
    } catch (err) {
      console.error('Unable to load PDF:', err);
      showError(`We couldn't open this PDF. ${err?.message || 'Check that the file is a valid PDF and try again.'}`);
      toast('Could not load the magazine.');
    } finally { isLoading = false; }
  }

  function initialiseFlipbook(images) {
    if (!window.St || !window.St.PageFlip) throw new Error('The page-turning library did not load. Check your internet connection and reload this page.');
    if (pageFlip) { try { pageFlip.destroy(); } catch {} pageFlip = null; }
    host.innerHTML = '';
    const fragment = document.createDocumentFragment();
    images.forEach((src, i) => {
      const page = document.createElement('div');
      page.className = 'page';
      page.dataset.density = (i === 0 || i === images.length - 1) ? 'hard' : 'soft';
      const content = document.createElement('div'); content.className = 'page-content';
      const img = document.createElement('img'); img.src = src; img.alt = `Magazine page ${i + 1}`; img.draggable = false;
      content.appendChild(img); page.appendChild(content); fragment.appendChild(page);
    });
    host.appendChild(fragment);
    const width = Math.min(BASE_WIDTH, Math.max(250, Math.floor((host.parentElement.clientWidth - 50) / 2)));
    const height = Math.min(BASE_HEIGHT, Math.max(330, Math.floor(host.parentElement.clientHeight - 38)));
    pageFlip = new window.St.PageFlip(host, {
      width, height, size: 'stretch', minWidth: 250, maxWidth: BASE_WIDTH, minHeight: 330, maxHeight: BASE_HEIGHT,
      showCover: true, usePortrait: true, startPage: 0, drawShadow: true, maxShadowOpacity: .24,
      flippingTime: 650, useMouseEvents: true, swipeDistance: 28, clickEventForward: true,
      mobileScrollSupport: false, showPageCorners: true, autoSize: true, disableFlipByClick: false
    });
    pageFlip.loadFromHTML(host.querySelectorAll('.page'));
    pageFlip.on('flip', e => { currentPage = Number(e.data) || 0; syncControls(); syncThumbnails(); });
    pageFlip.on('changeState', () => syncControls());
    pageFlip.on('init', e => { currentPage = Number(e.data?.page) || 0; syncControls(); });
    currentPage = 0; zoom = 1; updateZoom(); syncControls();
  }

  function buildThumbnails(images) {
    const wrap = $('thumbnails'); wrap.innerHTML = '';
    images.forEach((src, i) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'thumb'; btn.setAttribute('aria-label', `Go to page ${i + 1}`);
      const img = document.createElement('img'); img.src = src; img.alt = '';
      const label = document.createElement('span'); label.textContent = `Page ${i + 1}`;
      btn.append(img, label); btn.addEventListener('click', () => turnTo(i)); wrap.appendChild(btn);
    });
    syncThumbnails();
  }
  function syncThumbnails() {
    const activeIndex = Math.max(0, Math.min(currentPage, pageCount - 1));
    $('thumbnails').querySelectorAll('.thumb').forEach((btn, i) => { btn.classList.toggle('active', i === activeIndex); if (i === activeIndex) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current'); });
    $('thumbnails').querySelector('.thumb.active')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function syncControls() {
    if (pageFlip) { try { currentPage = pageFlip.getCurrentPageIndex(); } catch {} }
    pageCount = pageImages.length;
    $('goPage').value = String(Math.min(pageCount || 1, currentPage + 1)); $('goPage').max = String(pageCount || 1); $('totalPages').textContent = String(pageCount || 1);
    $('firstPage').disabled = !pageFlip || currentPage <= 0; $('prevPage').disabled = !pageFlip || currentPage <= 0;
    $('nextPage').disabled = !pageFlip || currentPage >= pageCount - 1; $('lastPage').disabled = !pageFlip || currentPage >= pageCount - 1;
    syncThumbnails();
  }
  function turnTo(index) { if (!pageFlip || !Number.isInteger(index) || index < 0 || index >= pageCount) return; try { pageFlip.flip(index); } catch { try { pageFlip.turnToPage(index); } catch {} } }
  function turnPrev() { if (pageFlip && currentPage > 0) pageFlip.flipPrev(); }
  function turnNext() { if (pageFlip && currentPage < pageCount - 1) pageFlip.flipNext(); }
  $('firstPage').addEventListener('click', () => turnTo(0)); $('prevPage').addEventListener('click', turnPrev);
  $('nextPage').addEventListener('click', turnNext); $('lastPage').addEventListener('click', () => turnTo(pageCount - 1));
  $('goPage').addEventListener('keydown', e => { if (e.key === 'Enter') { const raw = e.target.value.trim(); const n = Number(raw); if (!raw || !Number.isInteger(n) || n < 1 || n > pageCount) { toast(`Enter a whole page number from 1 to ${pageCount}.`); e.target.value = String(currentPage + 1); } else turnTo(n - 1); e.target.blur(); } });
  $('goPage').addEventListener('change', e => { const raw = e.target.value.trim(); const n = Number(raw); if (!raw || !Number.isInteger(n) || n < 1 || n > pageCount) { toast(`Enter a whole page number from 1 to ${pageCount}.`); e.target.value = String(currentPage + 1); } else turnTo(n - 1); });
  $('zoomIn').addEventListener('click', () => setZoom(zoom + .1)); $('zoomOut').addEventListener('click', () => setZoom(zoom - .1)); $('resetZoom').addEventListener('click', () => setZoom(1));
  function setZoom(value) { zoom = Math.min(1.4, Math.max(.7, Math.round(value * 10) / 10)); updateZoom(); }
  function updateZoom() { $('zoomLabel').textContent = `${Math.round(zoom * 100)}%`; host.style.transform = `scale(${zoom})`; host.style.transformOrigin = 'center center'; }

  // Rebuild the flipbook after a viewport/orientation change so dimensions remain inside the reader.
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (reader.classList.contains('is-open') && pageImages.length) { const old = currentPage; initialiseFlipbook(pageImages); turnTo(Math.min(old, pageImages.length - 1)); } }, 240); });
})();
