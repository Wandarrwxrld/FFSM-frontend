/* ==========================================================================
   FFMS — backend URL configuration.
   This is the ONE line to change once your Railway backend is live:

     export const API_BASE = 'https://your-app-name.up.railway.app/api';

   Everything else in the front end imports API_BASE from here — nothing
   else needs to change. After editing this file, redeploy the Netlify
   site (drag-and-drop the folder again, or git push if connected).

   Alternative, no-redeploy option: leave this file alone and instead set
   window.FFMS_API_BASE via Netlify's Snippet Injection (Site settings →
   Build & deploy → Post processing → Snippet injection → Before </head>):
     <script>window.FFMS_API_BASE = 'https://your-app-name.up.railway.app/api';</script>
   That overrides this file's value without touching any code.
   ========================================================================== */
export const API_BASE = window.FFMS_API_BASE || 'https://web-production-bdd2b6.up.railway.app/api';
