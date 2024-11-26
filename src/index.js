import { verify, decode } from '@tsndr/cloudflare-worker-jwt'

// only get public keys once per worker instance
let publicKeysMemo = null

export default {
	async fetch(request, env) {
		let responseObject = {}
		try {
			const publicKeys = await fetchPublicKeys()

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
			for (const publicKey of publicKeys.keys) {
				if (
					publicKey.kid === decodedJwt.header.kid &&
					publicKey.alg === decodedJwt.header.alg &&
					(await verify(jwt, publicKey, publicKey.alg))
				) {
					verified = true
					break
				}
			}

			responseObject = {
				jwt,
				from,
				verified,
				decodedJwt,
				publicKeys,
				ACCESS_TEAM_NAME: env.ACCESS_TEAM_NAME,
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

		// get public keys from Cloudflare
		// https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/#access-signing-keys
		async function fetchPublicKeys() {
			if (publicKeysMemo) return publicKeysMemo
			if (!env.ACCESS_TEAM_NAME) throw new Error('Missing env.ACCESS_TEAM_NAME')
			const keysUrl = `https://${env.ACCESS_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`
			const response = await fetch(keysUrl)
			if (!response.ok)
				throw new Error(
					`${response.statusText} Error fetching Cloudflare Access public keys from ${keysUrl}`
				)
			const publicKeys = await response.json()
			if (typeof publicKeys !== 'object' || !publicKeys.keys) {
				throw new Error(`Malformed Cloudflare Access public keys fetched from ${keysUrl}`)
			}
			publicKeysMemo = publicKeys
			return publicKeys
		}
	}
}
