# Errors

Approaches that took more than two attempts, and what worked instead.

## Font preview: the `<style>` element has to stay

`ModalHelper.createHtmlStyleElement()` triggers `obsidianmd/no-forbidden-elements`, and
the `eslint-disable` comment for that rule is itself disallowed, so the error stands.
Do not "fix" it by removing the preview.

**What didn't work:** Every element-free way to apply a user-supplied
`@import url('https://fonts.googleapis.com/css2?family=...')`:

- `CSSStyleSheet.replace()` / `replaceSync()` — strip `@import` by spec (MDN, both pages)
- `insertRule("@import ...")` on a constructable sheet — throws
- `CSSImportRule` — read-only, no constructor
- `FontFace` — needs family name + font-file URL; an `@import` points at a stylesheet,
  so this needs fetching and parsing the remote CSS
- `styles.css` (what the lint rule suggests) — static, can't hold a font the user names 
  at runtime and changes as they type

**What worked instead:** Keeping `containerEl.createEl("style")`. It is scoped to the
modal's `containerEl`, so it is removed with the modal — no global leak, which is what
the rule exists to prevent. The reasoning is documented at the call site.

**Note for next time:** The preview *does* work — verified visually 2026-09-22, a Google
font rendered live in the modal. Do not argue from the CSS spec's rule that `@import`
must precede other rules; it renders fine in an injected `<style>` in Electron.
