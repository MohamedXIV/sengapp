import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sengapp",
    short_name: "Sengapp",
    description: "A little place for big conversations.",
    start_url: "/",
    display: "standalone",
    background_color: "#17120f",
    theme_color: "#bb713e",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
