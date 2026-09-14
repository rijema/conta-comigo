import { notFound } from "next/navigation";
import { TitiaVoiceLab } from "./titia-voice-lab";

export default function TitiaVoiceDevelopmentPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TitiaVoiceLab />;
}
