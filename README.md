# access-jwt

```js
export default {
	async fetch(request) {
		const echo = {
			cf: request.cf,
			headers: Object.fromEntries(request.headers)
		}
		return new Response(JSON.stringify(echo,null,2), {
			headers: {
				"content-type": "application/json",
			},
		});
	},
};
```
- Deploy simple echo worker with the code above - I used the name `access-jwt`
- In worker settings > triggers, configure custom domain e.g. `access-jwt.jldec.me`
- Create a Zero Trust Access application on the same subdomain with a policy to allow everyone
- Login to the subdomain with your browser
- Worker requet headers should now include `cf-access-jwt-assertion header` and `cf-access-authenticated-user-email`
- According to [this post](https://community.cloudflare.com/t/securing-a-single-page-application-spa-behind-cloudflare-access/210484), these headers should not be spoofable.

- import code from playground
  `pnpm create cloudflare access-jwt --existing-script access-jwt`




