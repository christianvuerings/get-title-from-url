import { test, expect } from "@playwright/test";

[
  {
    url: "http://www.google.com",
    expected: {
      title: "Google",
      status: 200,
    },
  },
  {
    url: "https://github.com/features/copilot",
    expected: {
      title: "GitHub Copilot · Your AI pair programmer · GitHub",
      status: 200,
    },
  },
  // 404
  {
    url: "https://www.smashingmagazine.com/2019/07/better-compression-brotli-gzip",
    expected: {
      title: "404 Page not found — Smashing Magazine",
      status: 404,
    },
  },
  // Meta redirect
  {
    url: "https://stateofjs.com/", // Redirects to /en-US
    expected: {
      title: "State of JavaScript",
      status: 200,
    },
  },
  {
    url: "https://www.patterns.dev/posts/client-side-rendering", //  Redirects to /react/client-side-rendering
    expected: {
      title: "Client-side Rendering",
      status: 200,
    },
  },
  {
    url: "https://www.patterns.dev/vanilla/virtual-lists",
    expected: {
      title: "List Virtualization",
      status: 200,
    },
  },
  {
    url: "https://www.twitter.com", // Multiple redirects
    expected: {
      title: "Twitter",
      status: 200,
    },
  },
  {
    url: "https://web.dev/fast/#optimize-your-images",
    expected: {
      title: "Fast load times  |  web.dev",
      status: 200,
    },
  },
  // PDF
  {
    url: "http://worrydream.com/refs/Brooks-NoSilverBullet.pdf",
    expected: {
      title: "No Silver Bullet – Essence and Accident in Software Engineering",
      status: 200,
    },
  },
  {
    url: "https://curtclifton.net/papers/MoseleyMarks06a.pdf",
    expected: {
      title: "Out of the Tar Pit",
      status: 200,
    },
  },
  {
    url: "https://github.com/papers-we-love/papers-we-love/blob/master/design/out-of-the-tar-pit.pdf",
    expected: {
      title:
        "papers-we-love/design/out-of-the-tar-pit.pdf at main · papers-we-love/papers-we-love · GitHub",
      status: 200,
    },
  },
].forEach(({ url, expected }) => {
  test(`validate url: ${url}`, async ({ request }) => {
    const response = await (
      await request.get(`/api/get-title-from-url?url=${url}`)
    ).json();

    // Remove non-breaking spaces - required for web.dev and other google sites
    response.title = response.title.replace(/\u00a0/g, " ");
    expected.title = expected.title.replace(/\u00a0/g, " ");

    expect(response).toEqual(expected);
  });
});
