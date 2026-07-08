# SAGP

This project uses Next.js and Supabase for authentication, gamified security training, and admin workflows.

## Getting Started

Install dependencies and start the app locally:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Google and Microsoft SSO setup with Supabase

The app already supports OAuth sign-in through Supabase. To enable Google or Microsoft accounts, complete the following steps.

### 1. Configure the app URL

Set the public app URL before testing SSO:

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, set the same variable in your hosting environment to your deployed URL.

### 2. Enable the provider in Supabase

1. Open the Supabase Dashboard.
2. Go to Authentication > Providers.
3. Turn on Google and/or Microsoft (Azure AD / Entra ID).
4. Paste the Client ID and Client Secret from your OAuth app.

### 3. Google OAuth app setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs & Services > Credentials.
4. Create an OAuth 2.0 Client ID for a Web application.
5. Add these Authorized redirect URIs:
   - https://<your-project-ref>.supabase.co/auth/v1/callback
   - http://localhost:3000/auth/v1/callback
6. Copy the Client ID and Client Secret into Supabase.

### 4. Microsoft / Azure OAuth app setup

1. Open Azure Portal.
2. Go to Microsoft Entra ID > App registrations.
3. Create a new registration.
4. Under Authentication, add a Web platform redirect URI:
   - https://<your-project-ref>.supabase.co/auth/v1/callback
   - http://localhost:3000/auth/v1/callback
5. Under Certificates & secrets, create a client secret.
6. Copy the Application (client) ID and client secret into Supabase.

### 5. Test the flow

1. Sign in from the login page.
2. Choose Google or Microsoft.
3. Confirm the browser redirects back to the app and creates a session.

> If the login fails, verify that the redirect URIs match exactly and that the correct Client ID and Secret are stored in Supabase.
