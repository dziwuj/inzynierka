import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backendUrl = "https://inzynierka-backend.vercel.app";

  // Forward all query parameters
  const queryString = new URLSearchParams(
    req.query as Record<string, string>,
  ).toString();
  const targetUrl = `${backendUrl}/api/auth/google/callback?${queryString}`;

  console.log("🔵 OAuth callback proxy:", {
    query: req.query,
    targetUrl,
  });

  try {
    // Fetch from backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "manual", // Don't follow redirects automatically
    });

    console.log("📡 Backend response:", {
      status: response.status,
      location: response.headers.get("location"),
    });

    // If backend redirects, follow it
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        return res.redirect(307, location);
      }
    }

    // Forward backend response
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error("❌ OAuth callback proxy error:", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
}
