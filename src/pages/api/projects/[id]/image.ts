import type { APIRoute } from "astro";
import { updateProjectImage } from "../../../../lib/airtable";

export const PUT: APIRoute = async ({ request, params }) => {
	const id = params.id;
	if (!id) {
		return Response.json({ error: "No project ID specified" }, { status: 404 });
	}

	let data: FormData;
	try {
		data = await request.formData();
	} catch {
		return Response.json({ error: "Invalid form data body" }, { status: 400 });
	}

	const image = data.get("image");
	if (!(image instanceof File)) {
		return Response.json({ error: "No image file found" }, { status: 400 });
	}

	const ok = await updateProjectImage(id, image);
	if (!ok) {
		return Response.json({ error: "Failed to upload image" }, { status: 500 });
	}
	return Response.json({});
};
