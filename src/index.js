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
