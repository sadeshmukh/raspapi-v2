import type { APIRoute } from "astro";
import { z } from "zod";
import { getSession } from "../../../../../lib/session";
import { updateHackatimeId } from "../../../../../lib/airtable";

const UpdateSchema = z.object({
	hackatime_id: z.string().min(1),
});

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
	const session = await getSession(cookies, import.meta.env.SESSION_SECRET);
	if (!session) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}

	const adminIds = (import.meta.env.ADMIN_IDS ?? "")
		.split(",")
		.map((s: string) => s.trim())
		.filter(Boolean);
	if (!adminIds.includes(session.slack_id)) {
		return Response.json({ error: "Not authorized" }, { status: 403 });
	}

	const slack_id = params.slack_id;
	if (!slack_id) {
		return Response.json({ error: "Missing slack_id" }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = UpdateSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(
			{ error: "hackatime_id is required" },
			{ status: 400 },
		);
	}

	const ok = await updateHackatimeId(slack_id, parsed.data.hackatime_id);
	if (!ok) {
		return Response.json({ error: "Failed to update" }, { status: 500 });
	}

	return Response.json({ success: true });
};
