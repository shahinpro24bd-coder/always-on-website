import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TeamBrand } from "@/components/team-brand";
import { LoaderCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TEAM SHAHIN — Lead Workspace" },
      {
        name: "description",
        content:
          "TEAM SHAHIN: your private workspace for lead collection, verification and archiving.",
      },
      { property: "og:title", content: "TEAM SHAHIN — Lead Workspace" },
      {
        property: "og:description",
        content: "Manage your team's lead collection in TEAM SHAHIN.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/leads" : "/auth", replace: true });
    }).catch(() => navigate({ to: "/auth", replace: true }));
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <TeamBrand />
      <LoaderCircle className="size-5 animate-spin text-muted-foreground motion-reduce:animate-none" aria-label="Loading workspace" />
    </main>
  );
}
