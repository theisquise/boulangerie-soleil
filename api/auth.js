// Vercel serverless function — démarre le flux OAuth GitHub
// Decap CMS appelle /api/auth?provider=github

export default function handler(req, res) {
  const provider = (req.query && req.query.provider) || 'github';
  if (provider !== 'github') {
    res.status(400).send('Provider non supporté');
    return;
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('Configuration OAuth manquante (OAUTH_CLIENT_ID)');
    return;
  }

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${proto}://${host}/api/callback`;

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo,user');
  url.searchParams.set('state', state);

  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.writeHead(302, { Location: url.toString() });
  res.end();
}
