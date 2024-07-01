import { type NextRequest } from "next/server";
import { load } from "cheerio";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs";

class HTTPError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function getTitle(url: string) {
  const res = await fetch(new URL(url), {
    redirect: "follow",
    headers: {
      accept: "text/html",
      // Mimic a browser request
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: {
      // Revalidate every 60 minutes
      revalidate: 60 * 60,
    },
  });

  if (
    url.endsWith(".pdf") &&
    // In certain cases the URL ends with .pdf but the content type is not application/pdf
    // Such as a PDF on GitHub: https://github.com/papers-we-love/papers-we-love/blob/master/design/out-of-the-tar-pit.pdf
    res.headers.get("content-type") === "application/pdf"
  ) {
    const pdf = await pdfjsLib.getDocument(url).promise;
    // get the title of the pdf
    const metadata = await pdf.getMetadata();
    const { info } = metadata;

    return {
      title:
        // @ts-expect-error - info is typed as Object
        info.Title,
      status: 200,
    };
  }

  const data = await res.text();
  const $ = load(data);
  const title = $("head title").text();
  const metaTitle = $('meta[property="og:title"]').attr("content");
  const appleMobileWebAppTitle = $(
    'meta[name="apple-mobile-web-app-title"]',
  ).attr("content");
  const metaRefresh = $('meta[http-equiv="refresh"]')
    .attr("content")
    ?.replaceAll(" ", "");
  const metaRefreshUrl = metaRefresh?.match(/url=(.*)/i)?.[1];

  console.log({ title, metaTitle, appleMobileWebAppTitle, metaRefreshUrl });

  if (metaRefreshUrl) {
    return await getTitle(
      metaRefreshUrl?.startsWith("http")
        ? metaRefreshUrl
        : new URL(metaRefreshUrl, url).toString(),
    );
  }

  return {
    title: title || metaTitle || appleMobileWebAppTitle || "",
    status: res.status,
  };
}

// ?url=https://example.com
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  try {
    if (!url) {
      throw new HTTPError(400, `url query param is required`);
    }

    const { title, status } = await getTitle(url);

    return Response.json({ title, status });
  } catch (err) {
    console.log(err);
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
