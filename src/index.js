import { verify, decode } from '@tsndr/cloudflare-worker-jwt'

// only get public keys once per worker instance
let publicKeysMemo = null

export default {
	// scheduled refresh of public keys should happen at least once a week
	// according to docs, rotated keys will age out in 7 days
	// https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/#access-signing-keys
	async scheduled(event, env, ctx) {
    ctx.waitUntil(getPublicKeys(env, ctx, true));
  },

	// fetch handler demonstrates validation of Cloudflare Access JWT
	// protected routes will receive header and coookie
	// non-protected routes will receive cookie if previously authed
	// note: header can be spoofed (cloudflare does not strip header if passed in)
	async fetch(request, env, ctx) {
		let url = new URL(request.url)
		let forceFetch = !!url.searchParams.get('f')
		let responseObject = {}
		let usingKeys = 'from ?'
		try {
			const publicKeys = await getPublicKeys(env, ctx, forceFetch)

			let jwt = request.headers.get('cf-access-jwt-assertion')
			let from = 'header'

			// try using CF_Authorization cookie instead of header
			if (!jwt) {
				const cookies = request.headers.get('cookie')
				if (cookies) {
					const cfAuthCookie = cookies
						.split(';')
						.find((c) => c.trim().startsWith('CF_Authorization='))
					if (cfAuthCookie) {
						jwt = cfAuthCookie.split('=')[1].trim()
						from = 'cookie'
					}
				}
			}

			if (!jwt) throw new Error('No cf-access-jwt-assertion header or CF_Authorization cookie')

			const decodedJwt = await decode(jwt)

			let verified = false
			let keyNum = 0
			// loop through public keys to find a match
			for (const publicKey of publicKeys) {
				if (
					publicKey.kid === decodedJwt.header.kid &&
					publicKey.alg === decodedJwt.header.alg &&
					(await verify(jwt, publicKey, publicKey.alg))
				) {
					verified = true
					break
				}
				keyNum++
			}

			responseObject = {
				jwt,
				from,
				verified,
				keyNum,
				usingKeys,
				forceFetch,
				decodedJwt,
				publicKeys,
				requestHeaders: Object.fromEntries(request.headers),
				cf: request.cf
			}
		} catch (e) {
			responseObject = {
				error: e.message,
				requestHeaders: Object.fromEntries(request.headers),
				cf: request.cf
			}
		}

		return new Response(JSON.stringify(responseObject, null, 2), {
			headers: {
				'content-type': 'application/json;charset=utf-8'
			}
		})
	}
}

// get public keys from Cloudflare - use memo or env secret if possible
// if forceFetch is true, fetch keys regardless of cache
// use ctx.waitUntil() to store fetched keys in worker secret
async function getPublicKeys(env, ctx, forceFetch) {
	if (!forceFetch) {
		if (publicKeysMemo) {
			usingKeys = `from publicKeysMemo`
			return publicKeysMemo
		}
		if (env.CLOUDFLARE_ACCESS_PUBLIC_KEYS) {
			usingKeys = `from env.CLOUDFLARE_ACCESS_PUBLIC_KEYS`
			return JSON.parse(env.CLOUDFLARE_ACCESS_PUBLIC_KEYS)
		}
	}
	if (!env.CLOUDFLARE_ACCESS_TEAM_NAME) {
		throw new Error('Missing env.CLOUDFLARE_ACCESS_TEAM_NAME')
	}
	const keysUrl = `https://${env.CLOUDFLARE_ACCESS_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`
	const response = await fetch(keysUrl)
	if (!response.ok)
		throw new Error(
			`${response.statusText} Error fetching Cloudflare Access public keys from ${keysUrl}`
		)
	const obj = await response.json()
	if (typeof obj !== 'object' || !obj.keys) {
		throw new Error(`Malformed Cloudflare Access public keys fetched from ${keysUrl}`)
	}
	const publicKeys = obj.keys
	usingKeys = `fetched from ${keysUrl}`
	publicKeysMemo = publicKeys
	ctx.waitUntil(putPublicKeys(env, publicKeys))
	return publicKeys
}

async function putPublicKeys(env, publicKeys) {
	const resp = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${env.CLOUDFLARE_WORKER_NAME}/secrets`,
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`
			},
			body: JSON.stringify({
				name: 'CLOUDFLARE_ACCESS_PUBLIC_KEYS',
				text: JSON.stringify(publicKeys),
				type: 'secret_text'
			})
		}
	)
	console.log('update CLOUDFLARE_ACCESS_PUBLIC_KEYS', resp.status, await resp.text())
}
