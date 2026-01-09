import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://xn--v52b95rqmblr.com";

  const routes = [
    "", // 홈
    "/create", // 새 일정 만들기
  ];

  const now = new Date();

  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  }));
}
