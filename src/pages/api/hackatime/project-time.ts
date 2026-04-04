import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getProjectById, updateProjectHoursCache } from "../../../lib/airtable";
import { getSession } from "../../../lib/session";

const QuerySchema = z.object({
	id: z.string().min(1),
});

export const GET: APIRoute = async ({ cookies, url }) => {
	const session = await getSession(cookies, import.meta.env.SESSION_SECRET);
	if (!session) {
		return Response.json({ error: "Not logged in" }, { status: 401 });
	}

	const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return Response.json({ error: "Missing id" }, { status: 400 });
	}
	const { id: recordId } = parsed.data;

	const record = await getProjectById(recordId);
	if (!record) {
		return Response.json({ error: "Record not found" }, { status: 404 });
	}
	if (record.user_slack_id !== session.slack_id) {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}
	if (!record.hackatime_project) {
		return Response.json(
			{ error: "No hackatime project set" },
			{ status: 400 },
		);
	}

	const project = record.hackatime_project;
	const start = "2026-03-30T00:00:00Z";
	const apiUrl = `https://hackatime.hackclub.com/api/v1/users/${encodeURIComponent(session.slack_id)}/project/${encodeURIComponent(project)}?start=${start}`;
	console.log("[project-time] fetching", apiUrl);

	let res: Response;
	try {
		res = await fetch(apiUrl);
	} catch (err) {
		return Response.json(
			{ error: "Failed to reach Hackatime" },
			{ status: 502 },
		);
	}

	if (res.status === 401 || res.status === 403) {
		return Response.json({ error: "private" }, { status: 403 });
	}

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		console.error("[project-time] hackatime error body:", body); // TODO: handle {"error": "found nuthin"}
		return Response.json({ error: "Hackatime error" }, { status: 502 });
	}

	const data = await res.json();
	console.log("[project-time] response data:", JSON.stringify(data));

	const totalSeconds: number = data?.total_seconds ?? 0;

	const hours = totalSeconds / 3600;
	const updatedAt = Date.now();

	updateProjectHoursCache(recordId, hours, updatedAt).catch(() => {});

	return Response.json({ total_seconds: totalSeconds });
};
