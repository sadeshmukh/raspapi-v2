import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
	const params = new URLSearchParams({
		response_type: "code",
		client_id: import.meta.env.HCA_CLIENT_ID,
		redirect_uri: `${import.meta.env.PUBLIC_BASE_URL}/auth/callback`,
		scope: "verification_status slack_id",
	});

	const ref = url.searchParams.get("ref");
	const headers: Record<string, string> = {
		Location: `https://auth.hackclub.com/oauth/authorize?${params}`,
	};

	if (ref && /^\d{1,7}$/.test(ref) && parseInt(ref, 10) > 0) {
		headers["Set-Cookie"] =
			`ref=${ref}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;
	}

	return new Response(null, { status: 302, headers });
};
