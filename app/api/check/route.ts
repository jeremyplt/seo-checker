import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "SEO-Checker/1.0" } });
    const html = await res.text();

    const getTag = (name: string) => {
      const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"));
      return match?.[1] || "";
    };

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch?.[1]?.trim() || "";
    const description = getTag("description");
    const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1] || "";
    const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)].map((m) => m[1].replace(/<[^>]*>/g, "").trim());
    const imgCount = (html.match(/<img /gi) || []).length;
    const imgNoAlt = (html.match(/<img (?![^>]*alt=)[^>]*>/gi) || []).length;

    const og = {
      title: getTag("og:title"),
      description: getTag("og:description"),
      image: getTag("og:image"),
      type: getTag("og:type"),
      url: getTag("og:url"),
    };

    const twitter = {
      card: getTag("twitter:card"),
      title: getTag("twitter:title"),
      description: getTag("twitter:description"),
      image: getTag("twitter:image"),
    };

    const viewport = getTag("viewport");
    const robots = getTag("robots");
    const charset = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)/i)?.[1] || "";

    // Score
    let score = 0;
    const checks: { label: string; pass: boolean; tip: string }[] = [];
    const check = (label: string, pass: boolean, tip: string) => { checks.push({ label, pass, tip }); if (pass) score += 1; };

    check("Title tag", !!title, "Add a <title> tag");
    check("Title length (50-60 chars)", title.length >= 50 && title.length <= 60, `Current: ${title.length} chars`);
    check("Meta description", !!description, "Add a meta description");
    check("Description length (150-160)", description.length >= 150 && description.length <= 160, `Current: ${description.length} chars`);
    check("OG Title", !!og.title, "Add og:title meta tag");
    check("OG Description", !!og.description, "Add og:description");
    check("OG Image", !!og.image, "Add og:image for social sharing");
    check("Twitter Card", !!twitter.card, "Add twitter:card meta tag");
    check("Canonical URL", !!canonical, "Add canonical link");
    check("H1 tag present", h1s.length > 0, "Add an H1 heading");
    check("Single H1", h1s.length === 1, `Found ${h1s.length} H1 tags`);
    check("Viewport meta", !!viewport, "Add viewport meta for mobile");
    check("All images have alt", imgNoAlt === 0, `${imgNoAlt} images missing alt`);

    const scorePercent = Math.round((score / checks.length) * 100);

    return NextResponse.json({
      url, title, description, canonical, h1s, og, twitter, viewport, robots, charset,
      images: { total: imgCount, missingAlt: imgNoAlt },
      checks, score: scorePercent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch URL" }, { status: 500 });
  }
}
