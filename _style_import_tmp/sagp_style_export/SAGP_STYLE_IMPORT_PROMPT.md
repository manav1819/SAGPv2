# SAGP Style Import Prompt

Use this prompt in another project when you want an AI/code assistant to import the SAGP styling system.

```text
Import the SAGP cyberpunk design system into my project using the provided `sagp-style-export.css` file.

Apply the visual style consistently across the full application:
- Dark cyberpunk background using #0a0a1a and #0f0f2e
- Neon cyan #00f5ff, neon green #39ff14, and purple #bf5fff accents
- Orbitron headings, IBM Plex Mono labels/code, Exo 2 body/UI
- 4px sharp radius, glassmorphism panels, neon glows, scanline overlay, cyber grid background
- Use `.sagp-body sagp-scanlines sagp-cyber-grid` on the body/root
- Use `.sagp-navbar`, `.sagp-navbar-inner`, `.sagp-brand`, `.sagp-nav-link`, and `.sagp-mobile-tabs` for responsive navigation
- Use `.sagp-card` / `.sagp-neon-card` for all panels/cards
- Use `.sagp-btn sagp-btn-primary`, `.sagp-btn-secondary`, `.sagp-btn-ghost`, and `.sagp-btn-danger` for all buttons
- Use `.sagp-input`, `.sagp-select`, `.sagp-textarea`, `.sagp-badge`, and `.sagp-progress` for forms and indicators
- Use `.sagp-module-grid`, `.sagp-module-card`, `.sagp-game-shell-grid`, `.sagp-table`, `.sagp-podium-grid`, and `.sagp-profile-grid` for page structures

Refactor existing UI components to use the semantic SAGP CSS classes. Keep the app responsive for desktop, tablet, and mobile. Preserve accessibility with proper labels, focus states, semantic HTML, and keyboard navigation.
```
