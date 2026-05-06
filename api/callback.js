// Vercel serverless function — callback OAuth GitHub
// GitHub redirige ici avec ?code=...&state=...
// On échange le code contre un access_token et on poste le résultat dans la fenêtre Decap CMS

export default async function handler(req, res) {
  const code = req.query && req.query.code;
  const state = req.query && req.query.state;

  if (!code) {
    res.status(400).send('Code OAuth manquant');
    return;
  }

  // Vérification du state via cookie (CSRF)
  const cookieHeader = req.headers.cookie || '';
  const cookieState = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('oauth_state='));
  if (cookieState && state) {
    const expected = cookieState.split('=')[1];
    if (expected !== state) {
      res.status(400).send('État OAuth invalide');
      return;
    }
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send('Configuration OAuth manquante côté serveur');
    return;
  }

  let tokenJson;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    tokenJson = await tokenRes.json();
  } catch (e) {
    res.status(500).send('Erreur lors de l\'échange OAuth');
    return;
  }

  if (!tokenJson || !tokenJson.access_token) {
    res.status(500).send('Token OAuth introuvable: ' + JSON.stringify(tokenJson));
    return;
  }

  const payload = {
    token: tokenJson.access_token,
    provider: 'github',
  };

  // Réponse HTML : envoie le token au popup Decap CMS via postMessage
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Connexion réussie</title></head>
<body>
<p>Connexion en cours…</p>
<script>
(function(){
  var data = ${JSON.stringify(payload)};
  function send() {
    if (!window.opener) return;
    window.opener.postMessage('authorization:github:success:' + JSON.stringify(data), '*');
  }
  window.addEventListener('message', function(e) {
    if (e.data === 'authorizing:github') send();
  }, false);
  send();
  setTimeout(function(){ try { window.close(); } catch(e){} }, 1000);
})();
</script>
</body></html>`);
}
