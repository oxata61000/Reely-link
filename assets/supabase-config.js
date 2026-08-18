/* ============================================================
   Reely Links — Configuration Supabase
   La clé "anon" est publique par conception : la sécurité vient
   des règles RLS côté base, pas du secret de cette clé.
   ============================================================ */
(function (global) {
  'use strict';
  global.REELY_SUPABASE = {
    url: 'https://gyemsuqhpqitxzsttcbp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZW1zdXFocHFpdHh6c3R0Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjg1MTIsImV4cCI6MjEwMjY0NDUxMn0.rwNZMVIMtIf795kZl9l1lJSEy05ITmCUVPWcIGGYvAs'
  };
})(typeof window !== 'undefined' ? window : this);
