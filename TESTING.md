# Manual QA checklist

- [ ] Homepage links and CTA buttons open the intended sections/reader.
- [ ] The sample PDF loads through PDF.js and renders every page.
- [ ] StPageFlip provides actual animated page-turn transitions.
- [ ] Cover, middle pages and final page display in the expected order.
- [ ] Previous/Next and first/last controls are disabled at boundaries.
- [ ] Keyboard arrows, Home and End work when focus is not in a form control.
- [ ] Page input rejects empty, non-integer, negative and out-of-range values.
- [ ] Thumbnail selection changes the actual flipbook page.
- [ ] Zoom controls and reset respond to clicks.
- [ ] Fullscreen enters/exits without leaving the reader unusable.
- [ ] Local PDF selection replaces the current magazine and is not uploaded.
- [ ] Invalid files and oversized files show useful feedback.
- [ ] Narrow mobile widths do not produce horizontal page overflow.
- [ ] Reader can be closed and reopened.
- [ ] Console checked for dependency/network errors.
