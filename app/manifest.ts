import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrackLink",
    short_name: "TrackLink",
    description: "Private link analytics and click notifications",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#eef2f7",
    theme_color: "#0b1730",
    lang: "en",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
