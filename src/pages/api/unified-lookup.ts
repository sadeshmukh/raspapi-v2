import type { APIRoute } from "astro";
import { getSession } from "../../lib/session";

export const GET: APIRoute = async ({ request, cookies }) => {
	const session = await getSession(cookies, import.meta.env.SESSION_SECRET);
	if (!session) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	const url = new URL(request.url);
	const codeUrl = url.searchParams.get("codeUrl");
	if (!codeUrl) {
		return new Response(JSON.stringify({ error: "Missing codeUrl" }), {
			status: 400,
		});
	}

	const upstream = await fetch(
		`https://manifest.hackclub.com/api/lookup?codeUrl=${encodeURIComponent(codeUrl)}`,
	);

	const body = await upstream.text();
	return new Response(body, {
		status: upstream.status,
		headers: { "Content-Type": "application/json" },
	});
};
