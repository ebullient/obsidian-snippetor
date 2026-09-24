# Errors

Approaches that took more than two attempts, and what worked instead.

## Font preview: use an adopted stylesheet, not `<style>`

The live preview for a user-supplied
`@import url('https://fonts.googleapis.com/css2?family=...')` can't use a `<style>`
element: `obsidianmd/no-forbidden-elements` flags it, the `eslint-disable` comment
for that rule is itself disallowed, and review bans it.

**What didn't work:**

- `containerEl.createEl("style")` — banned (see above), even though it was scoped
  to the modal and worked visually
- `CSSStyleSheet.replace()` / `replaceSync()` with the `@import` — strip `@import`
  by spec (MDN, both pages)
- `insertRule("@import ...")` on a constructable sheet — throws
- `CSSImportRule` — read-only, no constructor
- `styles.css` (what the lint rule suggests) — static, can't hold a font the user
  names at runtime and changes as they type
- Adopting the sheet into a shadow root attached to the modal's `containerEl` —
  the font does not render. The modal's content stays in the light DOM (slotted),
  so font-family lookup happens in the document scope, and Chromium ignores
  `@font-face` in shadow roots anyway. There is no per-shadow-root `FontFaceSet`
  either, so `FontFace` objects can't be scoped that way.

**What worked instead:** `ModalHelper.loadFontPreview()`:

- Extract the URL from the `@import`; fetch it with `requestUrl` only if it is
  `https://fonts.googleapis.com` (`requestUrl` bypasses CORS)
- The fetched CSS is only `@font-face` rules, so `replaceSync()` accepts it
- Adopt that sheet into the modal's `doc.adoptedStyleSheets`
- `removeFontPreview()` (first line of each modal's `finish()`) removes it by
  identity, not index, and sets `fontClosed` so no later or in-flight load can
  re-add it

**Note for next time:** The adopted sheet is document-wide — it does not go away
with the modal. `removeFontPreview()` must stay the first line of `finish()`.
Only Google fonts preview; other `@import`s are still written to the snippet.
