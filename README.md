# bbb-pads
BigBlueButton's pads manager

## Instructions
At your BigBlueButton server, clone and install this app:
```bash
git clone https://github.com/bigbluebutton/bbb-pads.git
cd bbb-pads
npm install
```
Copy the settings' template file and replace `ETHERPAD_API_KEY` with your Etherpad's server API key
Find the key at `/usr/share/etherpad-lite/APIKEY.txt`
```bash
cp config/settings.json.template config/settings.json
```

### Etherpad authentication
Etherpad 2.0 replaced the `?apikey=` query parameter with OAuth2: HTTP API
calls carry a bearer token obtained from the OpenID Connect provider embedded
in Etherpad. `etherpad.api.auth` in `settings.json` selects the scheme:

| `auth.method` | Etherpad   | What `etherpad.api.key` is                              |
| ------------- | ---------- | -------------------------------------------------------- |
| `oauth2`      | >= 2.0     | the `client_secret` of the `auth.clientId` client        |
| `apikey`      | 1.x        | the content of `APIKEY.txt`, sent as `?apikey=`          |

With `oauth2` (the default) bbb-pads requests a token with the client
credentials grant at `auth.tokenPath` (`/oidc/token`), bound to the resource
`auth.resource` (Etherpad's own origin unless set; Etherpad's API only accepts
the JWT tokens its provider issues for a resource), caches it, renews it
`auth.refreshMargin` seconds before it expires and retries once with a fresh
token on a `401`. The client has to be registered in Etherpad's `settings.json`:
```json
"sso": {
  "issuer": "http://127.0.0.1:9001",
  "clients": [
    {
      "client_id": "bbb-pads",
      "client_secret": "<content of APIKEY.txt>",
      "grant_types": ["client_credentials"],
      "response_types": []
    }
  ]
}
```
The `bbb-etherpad` package does this for you and keeps `APIKEY.txt` as the
secret, so a single key configures both services.
Stop the service if it's running:
```bash
sudo systemctl stop bbb-pads
```

Run the app:
```bash
npm start
```
