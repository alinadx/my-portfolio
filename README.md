# My Portfolio

A local portfolio for design and frontend work, built from my own Figma wireframes with plain HTML, CSS, and JavaScript. There is no framework, build step, runtime dependency, or public deployment.

## Preview

Open `index.html` directly, or start the local server from the repository directory:

```sh
npm run dev
```

The command uses Python 3 to serve the site at **http://127.0.0.1:8000**. Stop it with `Ctrl+C`. Alternatively run `python3 -m http.server 8000 --bind 127.0.0.1` directly. `npm install` is not required.

Use an HTTP preview when reviewing saved preferences: browsers can apply different local-storage rules to pages opened as files.

## Implemented

- Homepage conversation, project collections, and combined legal/privacy page.
- Responsive CSS based on the 390px, 768px, and 1440px wireframes.
- Light/dark themes, saved preferences, and a system-theme default.
- Automatic three-dot conversation animation that never scrolls the page, plus **Show all** and reduced-motion support.
- English, German, Ukrainian, and Russian throughout the content, controls, image descriptions, page titles, and metadata.
- Native expandable experience sections and keyboard-scrollable project rows.
- Live visitor-local date/time and copyright year.
- Optimized images, SVG icons, favicon, skip navigation, and focus styles.
- English content and a system theme remain available without JavaScript.

## Source layout

| File or folder | Purpose |
| --- | --- |
| `index.html` | Profile and nine conversation sections |
| `my-projects.html` | Four project categories |
| `legal.html` | Draft legal notice and privacy policy |
| `styles.css` | Design tokens, layout, themes, responsive rules, and animations |
| `theme.js` | Applies the initial theme before the stylesheet loads |
| `translations.js` | Shared translation dictionary |
| `app.js` | Preferences, translations, date formatting, scrolling, and message playback |
| `Assets/` | Optimized images, favicon, and existing source icons |
| `docs/implementation.md` | Section-by-section explanation of the code |

## Content still needed

The implementation is ready for content and visual review. Calling the portfolio finished still requires:

- Behance profile and individual case-study URLs.
- LinkedIn profile and the final resume file.
- Four artwork images, titles, media, dimensions, and years.
- Approved descriptions of each design project's role, approach, and outcome.
- Review of the German, Ukrainian, and Russian draft translations.
- Final legal/privacy details.
- Approval of typography and visual matching. SF Pro Display is used where available; no licensed font file was supplied, so other systems use their native sans-serif fallback.

Missing links remain clearly marked text rather than fake buttons. The existing GitHub links come from this checkout’s repository configuration. No performance metrics or project outcomes have been invented.

## Verification status

**Tests and browser automation were skipped at your request.** No browser, accessibility, performance, or visual-accuracy pass is claimed. No test suite or testing dependencies are included.

The remaining acceptance review covers:

- All three pages at 320px, 390px, 768px, and 1440px, intermediate widths, landscape, and 200% zoom.
- Both themes, all languages, keyboard focus, screen-reader structure, and readable contrast.
- Animation order, cancellation, stationary scrolling, reduced motion, and language changes during playback.
- Disabled JavaScript, blocked storage, refresh, direct navigation, and local-storage persistence.
- Chrome, Firefox, and Safari, plus browser console/network and performance audits.

The light theme uses darker secondary text than the wireframes to improve readability. Shared navigation is included on the projects and legal pages; **Show all** is added beside the conversation date. These additions support navigation and animation control while keeping the existing design direction.
