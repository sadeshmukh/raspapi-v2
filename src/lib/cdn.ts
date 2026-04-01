export async function uploadToCDN(file: Blob): Promise<string> {
	const formData = new FormData();
	formData.append("file", file);

	const res = await fetch("https://cdn.hackclub.com/api/v4/upload", {
		method: "POST",
		headers: { Authorization: `Bearer ${import.meta.env.CDN_API_KEY}` },
		body: formData,
	});

	const { url } = await res.json();

	return url;
}
