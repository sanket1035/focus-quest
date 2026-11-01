// Fill these after creating the Supabase project (Settings -> API).
window.DUEL = {
  SUPABASE_URL: "https://fdejjgltpgnbtksjkqjv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZWpqZ2x0cGduYnRrc2prcWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MDc3MjEsImV4cCI6MjEwOTA4MzcyMX0.aad8ECBmR6LLKggPgEaxAKQyTW88zOONb3dqaZi_ERQ",
  // Emails must match the two users you create in Supabase (Authentication > Users), in lowercase.
  PLAYERS: [
    { name: "Sanket", email: "sanket@example.com", photo: "img/sanket.jpg" },
    { name: "Purva",  email: "purva@example.com",  photo: "img/purva.jpg" }
  ],
  START: "2026-11-02",
  END: "2026-12-06",
  // English-only (30 min) days: colloquium, practicals, semester exams
  LIGHT: [["2026-11-03","2026-11-04"],["2026-11-15","2026-11-20"],["2026-11-23","2026-12-04"]]
};
