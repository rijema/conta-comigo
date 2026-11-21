import { ActivitySandbox } from "./activity-sandbox";
import { OntologyView } from "./ontology-view";

export const metadata = { robots: "noindex, nofollow" };

export default function SandboxPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { view?: string };
}) {
  // Same hidden route; ?view=ontologia shows the published ontology instead
  // of the exercise sandbox.
  if (searchParams?.view === "ontologia") return <OntologyView locale={params.locale} />;
  return <ActivitySandbox />;
}
