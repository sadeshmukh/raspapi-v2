import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getSession } from "../../../lib/session";

const QuerySchema = z.object({
	slackId: z.string().min(1),
	project: z.string().min(1),
});

export const GET: APIRoute = async ({ cookies, url }) => {
	const session = await getSession(cookies, import.meta.env.SESSION_SECRET);
	if (!session) {
		return Response.json({ error: "Not logged in" }, { status: 401 });
	}

	const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return Response.json(
			{ error: "Missing slackId or project" },
			{ status: 400 },
		);
	}

	const { slackId, project } = parsed.data;
	const start = "2026-03-30";
	const end = new Date().toISOString().slice(0, 10);
	const apiUrl = `https://hackatime.hackclub.com/api/v1/users/${encodeURIComponent(slackId)}/heartbeats/spans?start_date=${start}&end_date=${end}&project=${encodeURIComponent(project)}`;

	let res: Response;
	try {
		res = await fetch(apiUrl);
	} catch {
		return Response.json(
			{ error: "Failed to reach Hackatime" },
			{ status: 502 },
		);
	}

	if (!res.ok) {
		console.error("[project-dates] hackatime error", res.status);
		return Response.json({ firstDate: null, lastDate: null });
	}

	const data = await res.json();
	const spans: { start_time: number; end_time: number }[] = data?.spans ?? [];

	if (spans.length === 0) {
		return Response.json({ firstDate: null, lastDate: null });
	}

	const toDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

	return Response.json({
		firstDate: toDate(spans[0].start_time),
		lastDate: toDate(spans[spans.length - 1].start_time),
	});
};
