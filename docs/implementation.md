# How the portfolio is built

Read the sections in this order. Each builds on the previous section and corresponds to one part of the implementation plan.

## 1. HTML: content before appearance

Each page has a header, navigation, one main landmark, and a footer. There is one `<h1>` per page. The homepage uses a `<section>` per question, with the question as its heading and Alina's replies beneath it.

```html
<section class="exchange" aria-labelledby="question-projects">
    <div class="message message--outgoing">
        <p class="message-sender" data-i18n="you">You</p>
        <h3 id="question-projects" data-i18n="projectsQuestion">
            What kind of projects do you work on?
        </h3>
    </div>
    <div class="reply-group">…</div>
</section>
```

`aria-labelledby` points to the heading's `id`, which gives the section an accessible name. Classes describe appearance; `data-*` attributes connect elements to JavaScript without depending on their styling classes.

The first link skips repeated navigation and goes to `<main>`. Project cards are `<article>` elements inside lists. Each meaningful image has an `alt` description; repeated avatars are decorative and use `alt=""`.

Experience uses `<details open>` and `<summary>`. The browser supplies keyboard behavior and expanded/collapsed state. Keeping this native avoids writing a custom accordion or losing functionality when scripts are disabled.

**Explore:** open an HTML file and find the question, reply group, and heading it refers to. Try collapsing an experience entry using the keyboard.

## 2. CSS: a small visual system

The top of `styles.css` defines custom properties:

```css
:root {
    --background: #fff;
    --surface: #e4e4e4;
    --accent: #4f35e0;
    --column: 596px;
}
```

Changing one token updates every component that uses it. The dark-theme selector overrides colors while keeping the layout rules shared. The wireframes' secondary grey was darkened on light backgrounds for readability.

The homepage uses a centered column capped at 596px. `width: min(596px, calc(100% - 40px))` leaves 20px on each side on narrow screens. Message bubbles use different corner radii to create the chat shape. Reply avatars sit in a reserved left gutter on larger screens and disappear on mobile, matching the reference.

Flexbox handles navigation, footer links, and horizontal project collections. Grid arranges the tool logos. Below 600px, the avatar gutter disappears, card padding changes, and the header starts at the top of the screen. Text can grow with translations rather than relying on the fixed artboard heights.

Images have reserved dimensions and CSS aspect ratios. `object-fit: cover` crops the existing image within its designed frame. Photos and illustration JPEGs were resized; project previews were converted to smaller JPEGs. The original SVG exports still contain the original image data.

**Explore:** change `--accent` temporarily, then restore it. Resize the browser and watch how the same HTML adapts without duplicating a mobile version.

## 3. Theme: avoid a light flash

`theme.js` is a small regular script placed before the stylesheet. It reads the saved theme and sets `data-theme` on `<html>` before the stylesheet paints the page. When there is no saved choice, it uses the system preference.

`app.js` connects the theme buttons afterward. The controls use `role="switch"` and `aria-checked` to expose their state. A manual choice is saved under `portfolio-theme`. If storage is blocked, the choice still works for the current page.

If JavaScript is disabled entirely, a CSS `prefers-color-scheme` query provides the system theme. Script-dependent controls start with `hidden` and are only shown after their handlers are attached.

**Explore:** switch themes, navigate to My Projects, and reload. Delete the saved preference in browser storage to return to the system default.

## 4. Animation: progressive enhancement

All messages are present in the HTML. JavaScript temporarily marks future exchanges and replies as pending. `visibility: hidden` reserves their final space; `inert` and `aria-hidden` keep them out of keyboard navigation and the accessibility tree until revealed.

For each exchange, the code:

1. Reveals the question.
2. Waits 150ms, then shows the reply sender and three decorative dots.
3. Waits 450ms and removes the dots.
4. Reveals the replies with 150ms between bubbles.
5. Reveals the avatar and proceeds to the next question.

The JavaScript does not call a scrolling API for the conversation. Reserved layout space also avoids shifting later content as messages appear. The only scrolling API is in the keyboard handler for horizontal project rows.

`AbortController` is the cancellation signal for playback. Clicking **Show all**, changing language, enabling reduced motion, printing, leaving the page, or moving the tab into the background cancels the pending delay and reveals the entire conversation. The `finally` block also reveals everything if playback fails unexpectedly.

Typing indicators are decorative rather than live announcements. This avoids reading out the whole conversation as an unsolicited stream. With reduced motion enabled, all content is shown immediately.

**Explore:** reload and use Show all while the dots are visible. The final content should be the same as waiting for playback to finish.

## 5. Languages: text and interface labels

`translations.js` contains one shared dictionary. Each key has four values in a fixed order:

```js
projects: ["My Projects", "Meine Projekte", "Мої проєкти", "Мои проекты"]
```

The corresponding HTML element uses `data-i18n="projects"`. The language function looks up the selected entry and assigns it with `textContent`. Translations cannot insert markup or change link destinations.

Separate attributes translate image descriptions, accessible labels, metadata, and the page title. Proper names and tool brands stay unchanged where appropriate. The document's `lang` attribute changes along with the visible language.

The preference is saved under `portfolio-language`; a new visitor starts in English. A language change reveals the complete conversation, so old animation timers cannot continue after content changes. If the translation file fails to load, the language control stays hidden and the original English content remains available.

Dates use `Intl.DateTimeFormat` with the selected locale. The live clock uses the visitor's time zone and refreshes each minute. Month-only experience dates keep their original machine-readable `datetime` values.

**Explore:** find `introQuestion` in the dictionary and its matching HTML attribute. When adding a new translated text, add both the English HTML fallback and all four dictionary values.

## 6. Honest content and finishing work

The email address and biography come from the supplied wireframes. GitHub destinations come from the repository's configured URL. Missing artwork, case studies, LinkedIn, and resume stay explicitly marked and non-clickable until real files or URLs are supplied.

The legal page is a draft based on the supplied design. The storage section now describes the preferences the implementation actually saves. Public release and final content approval are separate from this local implementation.

`.gitignore` excludes macOS metadata and local dependency/cache folders. The two previously tracked `.DS_Store` files were removed from Git's index while preserving the local files.

**Verification remains pending:** the user requested skipping tests. The README lists the browser, accessibility, motion, translation, and visual checks needed before calling the portfolio finished.
