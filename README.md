# access-jwt

Example Cloudflare worker to decode and validate [Cloudflare Access JWT tokens](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json).

Depends on [@tsndr/cloudflare-worker-jwt](https://github.com/tsndr/cloudflare-worker-jwt)

[The code](https://github.com/jldec/access-jwt/blob/main/src/index.js#L10-L43) fetches public keys from `https://${env.ACCESS_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`. Your team name can be found in the Custom Pages settings of the Cloudflare [Zero Trust dashboard](https://one.dash.cloudflare.com).

By decoding the JWT from the `CF_Authorization` cookie instead of relying on the `cf-access-jwt-assertion` header, you can continue identifying authenticated users even for un-authed routes on the same origin, once they have logged in. This works because the cookie is scoped to the hostname unless you explicitly configure Access to scope the cookie to the application path.

Originally motivated by [this thread](https://x.com/adam_janis/status/1823330661140181204) by [Adam Janiš](https://github.com/eidam).  
[Alternative implementation](https://gist.github.com/eidam/7fb298196a43b2c172245219c6dd7da1) using [hono](https://hono.dev/) middleware and [jose](https://github.com/panva/jose).

### Example endpoint
https://access-jwt.jldec.me/
![Screenshot 2024-11-26 at 12 12 36](https://github.com/user-attachments/assets/dd085e35-c890-4da4-9ca3-243bbe02f126)


### To deploy on your own Cloudflare Access protected endpoint
- Set ACCESS_TEAM_NAME to your own Cloudflare Access team name in wrangler.toml.
- Run `pnpm install` and `pnpm run deploy`.
- Configure the deployed worker to trigger on your endpoint.
- Open the endpoint and authenticate with your browser.

### Possible improvements
- [ ] Tests
- [ ] TypeScript
- [ ] Mock jwt and keys for local use
