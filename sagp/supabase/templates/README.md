# SAGP Auth Email Templates

Six branded HTML templates for Supabase Auth, matching SAGP's dark cyberpunk theme (cyan `#00f5ff` / green `#39ff14` / purple `#bf5fff` / danger `#ff3b81`, Orbitron + IBM Plex Mono). Table-based layout, inline styles, Outlook VML button fallback — tested against the usual email-client constraints (no CSS gradients/box-shadow reliance, no external fonts required).

| File | Supabase template | Variables used |
|---|---|---|
| `confirmation.html` | Confirm signup | `{{ .ConfirmationURL }}` |
| `invite.html` | Invite user | `{{ .ConfirmationURL }}`, `{{ .Email }}` |
| `magic_link.html` | Magic link / OTP | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}` |
| `email_change.html` | Change email address | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` |
| `recovery.html` | Reset password | `{{ .ConfirmationURL }}`, `{{ .Email }}` |
| `reauthentication.html` | Reauthentication | `{{ .Token }}` (code only — Supabase does not issue a link for this template) |

## Wiring into Supabase

**Option A — local dev / self-hosted (`supabase/config.toml`)**

Add to `supabase/config.toml` (create the file if this project doesn't have one yet; it isn't checked in currently):

```toml
[auth.email.template.confirmation]
subject = "Confirm your SAGP account"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.invite]
subject = "You've been invited to SAGP"
content_path = "./supabase/templates/invite.html"

[auth.email.template.magic_link]
subject = "Your SAGP sign-in link"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.email_change]
subject = "Confirm your new SAGP email address"
content_path = "./supabase/templates/email_change.html"

[auth.email.template.recovery]
subject = "Reset your SAGP password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.reauthentication]
subject = "Confirm it's really you — SAGP"
content_path = "./supabase/templates/reauthentication.html"
```

Then `supabase start` (local) or `supabase db push` / redeploy for the hosted project to pick up the change, depending on your workflow.

**Option B — hosted dashboard**

Supabase Dashboard → Authentication → Email Templates → paste each file's HTML into the matching template, and set the subject line from the table above.

## Notes

- `{{ .Token }}` is the 6-digit OTP Supabase generates alongside every confirmation link — shown as a monospace fallback for magic link, and as the *only* mechanism for reauthentication.
- Reauthentication has no link by design (Supabase requires the code to be entered inside an already-authenticated session), so its template skips the CTA button other templates use.
- Default expiry copy (24h for confirmation/email change, 1h for recovery/magic link, 10min for reauthentication) reflects Supabase's defaults — adjust the wording if your project's `auth.email.otp_expiry` / `auth.email.recovery_expiry` values differ.
- Preheader text (hidden div at top of `<body>`) is set per template for accurate inbox previews.
