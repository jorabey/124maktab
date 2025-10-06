// Supabase ulash (siz bergan URL va KEY)
    const SUPABASE_URL = "https://enkqruajxnolwpuxosfg.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVua3FydWFqeG5vbHdwdXhvc2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjUzNTcsImV4cCI6MjA3MzcwMTM1N30.TJ1MkVIrxmqIpaLcJjnoTE1glaZ_u5laXuw0jmsJyfE";
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const $ = (id) => document.getElementById(id);
   
