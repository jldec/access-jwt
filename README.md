# access-jwt

Cloudflare Worker to decode and validate [Cloudflare Access JWT tokens](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json).

Depends on [@tsndr/cloudflare-worker-jwt](https://github.com/tsndr/cloudflare-worker-jwt)

### Example endpoint
https://access-jwt.jldec.me/

### To deploy on your own Cloudflare Access protected endpoint

- Modify `wrangler.toml` to use your own Cloudflare Access team name. This is required in order to fetch public keys from `https://${env.ACCESS_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`. _The team name can be found in the Custom Pages settings of the Cloudflare [Zero Trust dashboard](https://one.dash.cloudflare.com)._

- Run `pnpm install` and `pnpm run deploy`
- Configure the deployed worker to trigger on your endpoint
- Open the endpoint and authenticate with your browser
