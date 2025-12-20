// Vercel Edge Function to proxy all /api/* requests to backend
export const config = {
  runtime: "edge",
  matcher: "/api/:path*",
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const backendUrl = `https://inzynierka-backend.vercel.app${url.pathname}${url.search}`;

  console.log(`[API Proxy] ${req.method} ${url.pathname} -> ${backendUrl}`);

  try {
    // Forward the request to backend
    const backendResponse = await fetch(backendUrl, {
      method: req.method,
      headers: req.headers,
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      redirect: "manual", // Important for OAuth redirects
    });

    // If backend returns a redirect, return it as-is
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get("location");
      console.log(`[API Proxy] Backend redirect to: ${location}`);
      return new Response(null, {
        status: backendResponse.status,
        headers: {
          Location: location || "/",
        },
      });
    }

    // Return backend response
    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: backendResponse.headers,
    });
  } catch (error) {
    console.error("[API Proxy] Error:", error);
    return new Response("Backend proxy error", { status: 502 });
  }
}
