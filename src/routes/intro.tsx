import { createFileRoute } from "@tanstack/react-router";
import IntroPage from "@/components/intro/IntroPage";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "ShadiPlan — Plan your wedding, your way" },
      {
        name: "description",
        content:
          "Engagement, Haldi-Mehendi, Wedding, Reception — vendors, guests and budget for every ceremony in one place.",
      },
      { property: "og:title", content: "ShadiPlan — Plan your wedding, your way" },
      {
        property: "og:description",
        content:
          "Engagement, Haldi-Mehendi, Wedding, Reception — vendors, guests and budget for every ceremony in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "ShadiPlan — Plan your wedding, your way",
      },
      {
        name: "twitter:description",
        content:
          "Engagement, Haldi-Mehendi, Wedding, Reception — vendors, guests and budget for every ceremony in one place.",
      },
    ],
  }),
  component: IntroPage,
});
