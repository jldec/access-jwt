# access-jwt

Example Cloudflare Worker to decode and validate [Cloudflare Access JWT tokens](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json).

Depends on [@tsndr/cloudflare-worker-jwt](https://github.com/tsndr/cloudflare-worker-jwt)

Fetches public keys from `https://${env.ACCESS_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`.  
The team name can be found in the Custom Pages settings of the Cloudflare [Zero Trust dashboard](https://one.dash.cloudflare.com).

Originally motivated by [this thread](https://x.com/adam_janis/status/1823330661140181204) by [Adam Janiš](https://github.com/eidam).  
See [Alternative implementation](https://gist.github.com/eidam/7fb298196a43b2c172245219c6dd7da1) using [hono](https://hono.dev/) middleware and [jose](https://github.com/panva/jose).

### Example endpoint
https://access-jwt.jldec.me/
![Screenshot 2024-08-13 at 18 55 54](https://github.com/user-attachments/assets/443cb4c0-13e3-410f-8629-1c0d31b7d587)

### To deploy on your own Cloudflare Access protected endpoint
- Set ACCESS_TEAM_NAME to your own Cloudflare Access team name in wrangler.toml.
- Run `pnpm install` and `pnpm run deploy`.
- Configure the deployed worker to trigger on your endpoint.
- Open the endpoint and authenticate with your browser.

### Possible improvements
- [ ] Tests
- [ ] TypeScript
- [ ] Mock jwt and keys for local use
