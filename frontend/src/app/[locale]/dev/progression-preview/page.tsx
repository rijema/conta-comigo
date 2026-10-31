"use client";
// Dev-only preview used by e2e/progression/verify.js (Playwright). Renders the
// 2º–5º ano exercises from public/__progression-preview.json without a backend.
import { useEffect, useState } from "react";
import { ActivityRenderer } from "@/components/activity/activity-renderer";

export default function Preview() {
  const [acts, setActs] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<string>("");
  useEffect(() => {
    setI(Number(new URLSearchParams(window.location.search).get("i") ?? 0));
    fetch("/__progression-preview.json").then((r) => r.json()).then(setActs);
  }, []);
  const a = acts[i];
  if (!a) return <p>loading</p>;
  return (
    <div className="mx-auto max-w-5xl p-3">
      <ActivityRenderer key={a.id} activity={a} onAnswer={(ans) => setAnswer(JSON.stringify(ans))} />
      <pre id="__answer" data-answer={answer}>{answer}</pre>
    </div>
  );
}
