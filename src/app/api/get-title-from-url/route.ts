import { type NextRequest } from "next/server";

class HTTPError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ?url=https://example.com
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  try {
    if (!url) {
      throw new HTTPError(400, `url query param is required`);
    }

    const res = await fetch(new URL(url), {
      redirect: "follow",
      headers: {
        // Mimic a browser request
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
      next: {
        // Revalidate every 60 minutes
        revalidate: 60 * 60,
      },
    });
    const data = await res.text();
    const title = data.match(/<title>(.*?)<\/title>/i)?.[1];

    return Response.json({ title, status: res.status });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "An error occurred",
      },
      {
        status: err instanceof HTTPError ? err.status : 500,
      },
    );
  }
}
