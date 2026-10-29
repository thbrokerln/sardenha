import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TH Imóveis · CRM",
    short_name: "TH CRM",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6FA",
    theme_color: "#0B2545",
    icons: [{ src: "/icon-app.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
