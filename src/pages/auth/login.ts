import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies }) => {
	const params = new URLSearchParams({
		response_type: "code",
		client_id: import.meta.env.HCA_CLIENT_ID,
		redirect_uri: `${import.meta.env.PUBLIC_BASE_URL}/auth/callback`,
		scope: "verification_status slack_id",
	});

	const ref = url.searchParams.get("ref");
	if (ref && /^\d{1,7}$/.test(ref) && parseInt(ref, 10) > 0) {
		cookies.set("ref", ref, {
			httpOnly: true,
			sameSite: "lax",
			maxAge: 600,
			path: "/",
		});
	}

	return Response.redirect(
		`https://auth.hackclub.com/oauth/authorize?${params}`,
	);
};
