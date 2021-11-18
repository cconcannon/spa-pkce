const loginBtn1 = document.getElementById('login');
const refreshBtn1 = document.getElementById('refresh');
const loginBtn2 = document.getElementById('login2');
const refreshBtn2 = document.getElementById('refresh2');

loginBtn1.addEventListener('click', async function(event) {
  authServer = AUTH_DOMAIN_1;
  event.preventDefault();
  const config = await getConfig(authServer);

  const state = randomString(32);
  const codeVerifier = randomString(48);
  const codeChallenge = await sha256(codeVerifier).then(bufferToBase64UrlEncoded);

  const authorizationEndpointUrl = new URL(config.authorization_endpoint);

  // here we encode the authorization request
  authorizationEndpointUrl.search = new URLSearchParams({
    audience: API_AUDIENCE_1,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID_1,
    response_type: 'code',
    scope: 'openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  // we need to store the state to validate the callback
  // and also the code verifier to send later
  sessionStorage.setItem(`login-code-verifier-${state}`, codeVerifier);
  sessionStorage.setItem('last-requested-authz-server', authServer);
  sessionStorage.setItem('last-requested-audience', API_AUDIENCE_1);
  sessionStorage.setItem('last-client-id', CLIENT_ID_1);

  window.location.assign(authorizationEndpointUrl);
});

loginBtn2.addEventListener('click', async function(event) {
  authServer = AUTH_DOMAIN_2;
  event.preventDefault();
  const config = await getConfig(authServer);

  const state2 = randomString(32);
  const codeVerifier = randomString(48);
  const codeChallenge = await sha256(codeVerifier).then(bufferToBase64UrlEncoded);
  const authorizationEndpointUrl = new URL(config.authorization_endpoint);

  // here we encode the authorization request
  authorizationEndpointUrl.search = new URLSearchParams({
    audience: API_AUDIENCE_2,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID_2,
    response_type: 'code',
    scope: 'openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state2
  });

  // we need to store the state to validate the callback
  // and also the code verifier to send later
  sessionStorage.setItem(`login-code-verifier-${state2}`, codeVerifier);
  sessionStorage.setItem('last-requested-authz-server', authServer);
  sessionStorage.setItem('last-requested-audience', API_AUDIENCE_2);
  sessionStorage.setItem('last-client-id', CLIENT_ID_2);

  window.location.assign(authorizationEndpointUrl);
});

window.onload = async function handleCallback() {
  authServer = sessionStorage.getItem('last-requested-authz-server');
  audienceClaim = sessionStorage.getItem('last-requested-audience');
  clientId = sessionStorage.getItem('last-client-id');
  const search = new URLSearchParams(window.location.search);
  if(!search.has('code')) { return; }
  const code = search.get('code');
  const state = search.get('state');
  const code_verifier = sessionStorage.getItem(`login-code-verifier-${state}`);

  if (!code_verifier) {
    console.error('unexpected state parameter');
    return;
  }

  sessionStorage.has
  const config = await getConfig(authServer);

  // exchange the authorization code for a tokenset
  const tokenSet = await fetch(config.token_endpoint, {
    method: 'POST',
    body: new URLSearchParams({
      audience: audienceClaim,
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier,
      code,
    }),
    headers: new Headers({
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    })
  }).then(r => r.json());

  //this has access_token, id_token, expires_in, scope, token_type.
  console.dir(tokenSet);

  window.tokenSet = tokenSet;
  window.verifier = code_verifier

  //remove the querystring from the url in the address bar
  const url = new URL(window.location);
  url.search = '';
  window.history.pushState('', document.title, url);
};
