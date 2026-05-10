# SAGP Style Export

This folder contains a complete, reusable CSS export from the fresh SAGP Security Gamification Platform project.

## Files

- `sagp-style-export.css` — standalone CSS design system for use in another project.
- `sagp-tailwind-class-reference.md` — original Tailwind class structures used in the SAGP project.
- `sagp-html-structure-examples.html` — copy-paste HTML examples for navbar, hero, cards, module grid, game shell, leaderboard, and forms.
- `sagp-theme-tokens.json` — colors, fonts, shadows, and component token values.
- `SAGP_STYLE_IMPORT_PROMPT.md` — AI prompt you can paste into another project to import this exact style.

## Fast import

Copy `sagp-style-export.css` into your new project, then import it once globally.

### Next.js App Router

```ts
// src/app/layout.tsx
import './sagp-style-export.css';
```

Then wrap the page or body:

```tsx
<body className="sagp-body sagp-scanlines sagp-cyber-grid">
  <main className="sagp-main">
    {children}
  </main>
</body>
```

## Minimal page shell

```html
<body class="sagp-body sagp-scanlines sagp-cyber-grid">
  <div class="sagp-app">
    <header class="sagp-navbar">...</header>
    <main class="sagp-main sagp-container sagp-stack">...</main>
    <nav class="sagp-mobile-tabs">...</nav>
  </div>
</body>
```

## Notes

The original project used Tailwind CSS utility classes inside React components. This export converts those styles into reusable semantic CSS classes so you can import the look into any React, Next.js, HTML, Vue, or plain CSS project.
