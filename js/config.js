/* ==========================================================================
   FFMS — backend URL configuration.
   The backend is hosted on Vercel; the MySQL database stays on Railway.

   Use the backend's STABLE production domain here (Vercel dashboard ->
   backend project -> Domains), e.g. https://your-backend.vercel.app —
   NOT a per-deployment URL like https://name-abc123xyz-team.vercel.app,
   which changes on every deploy and is login-protected by default.

   Alternative with no redeploy: set window.FFMS_API_BASE via Netlify's
   Snippet Injection and it overrides the value below.
   ========================================================================== */
export const API_BASE = window.FFMS_API_BASE || 'https://ffsm-backend-ej14fjuhn-wandarrwxrld.vercel.app/api';
