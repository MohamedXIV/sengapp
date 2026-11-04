import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sengapp",
    short_name: "Sengapp",
    description: "A little place for big conversations.",
    start_url: "/",
    display: "standalone",
    background_color: "#e7f0e8",
    theme_color: "#e7f0e8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
