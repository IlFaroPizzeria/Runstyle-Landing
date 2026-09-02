// Coloca este archivo en: api/subscribe.js (en la raíz de tu repo)
// Vercel lo detecta automáticamente como función serverless.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source } = req.body || {};

  const isValidEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist_emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        // Si el email ya existe (columna unique), no falla: lo ignora.
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify([
        {
          email: email.toLowerCase().trim(),
          source: typeof source === 'string' ? source.slice(0, 100) : null,
        },
      ]),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase insert error:', errText);
      return res.status(500).json({ error: 'Could not save email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}