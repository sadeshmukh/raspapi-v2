import type { APIRoute } from "astro";
import {
	createShipEntry,
	getProjectById,
	getSubmissionById,
	getUserBySlackId,
} from "../../../../lib/airtable";
import { getSession } from "../../../../lib/session";

export const POST: APIRoute = async ({ cookies, params }) => {
	const id = params.id;
	if (!id) {
		return Response.json({ error: "No submission ID" }, { status: 404 });
	}

	const session = await getSession(cookies, import.meta.env.SESSION_SECRET);
	if (!session) {
		return Response.json({ error: "Not logged in" }, { status: 401 });
	}

	const adminIds = (import.meta.env.ADMIN_IDS ?? "")
		.split(",")
		.map((s: string) => s.trim())
		.filter(Boolean);

	if (!adminIds.includes(session.slack_id)) {
		return Response.json({ error: "Not authorized" }, { status: 403 });
	}

	const submission = await getSubmissionById(id);
	if (!submission) {
		return Response.json({ error: "Submission not found" }, { status: 404 });
	}

	if (submission.review_status !== "approved") {
		return Response.json(
			{ error: "Submission is not approved" },
			{ status: 409 },
		);
	}

	const [project, user] = await Promise.all([
		getProjectById(submission.project_id),
		getUserBySlackId(submission.user_slack_id),
	]);

	if (!project || !user) {
		return Response.json(
			{ error: "Could not load project or user" },
			{ status: 500 },
		);
	}

	const effectiveHours =
		submission.approved_hours > 0
			? submission.approved_hours
			: submission.hours_at_submission;

	const ok = await createShipEntry({
		user,
		code_url: project.repo_url ?? "",
		playable_url: project.project_url ?? "",
		hours_spent: effectiveHours,
		override_hours_justification: submission.override_hours_justification,
		screenshot: project.image_url ?? "",
		description: project.description,
	});

	if (!ok) {
		return Response.json(
			{ error: "Failed to push to unified table" },
			{ status: 500 },
		);
	}

	return Response.json({ success: true });
};
