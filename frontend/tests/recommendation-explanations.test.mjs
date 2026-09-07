import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const gateSource = readFileSync(
  new URL("../src/lib/research-debug.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(gateSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const gateModule = { exports: {} };
new Function("exports", "module", compiled)(gateModule.exports, gateModule);
const { isResearchDebugEnabled } = gateModule.exports;

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const educatorDashboard = read("../src/app/[locale]/dashboard/educator/page.tsx");
const guardianDashboard = read("../src/app/[locale]/dashboard/guardian/page.tsx");
const childSession = read("../src/hooks/use-session.tsx");
const panel = read("../src/components/recommendation/research-debug-panel.tsx");

test("normal URL does not enable the research view", () => {
  assert.equal(isResearchDebugEnabled({
    environmentFlag: "true",
    queryValue: null,
    role: "professional",
  }), false);
});

test("query parameter alone does not enable research when the flag is disabled", () => {
  assert.equal(isResearchDebugEnabled({
    environmentFlag: "false",
    queryValue: "true",
    role: "professional",
  }), false);
});

test("research view additionally requires an authorized existing role", () => {
  assert.equal(isResearchDebugEnabled({
    environmentFlag: "true",
    queryValue: "true",
    role: "guardian",
  }), false);
  assert.equal(isResearchDebugEnabled({
    environmentFlag: "true",
    queryValue: "true",
    role: "professional",
  }), true);
  assert.equal(isResearchDebugEnabled({
    environmentFlag: "true",
    queryValue: "true",
    role: "admin",
  }), true);
});

test("role-appropriate screens do not expose the old raw technical explanation", () => {
  assert.match(guardianDashboard, /guardianExplanation/);
  assert.doesNotMatch(guardianDashboard, /xaiLog/);
  assert.match(educatorDashboard, /professionalExplanation\.summary/);
  assert.match(educatorDashboard, />Ver detalhes</);
  assert.doesNotMatch(childSession, /xaiLog|groupCollapsed/);
});

test("the hidden panel includes every required technical field", () => {
  for (const label of [
    "Recommendation ID", "Target BNCC skill", "StudentSkillState / mastery",
    "Learning Need", "Challenge Fit", "Interaction Fit", "Semantic Fit",
    "Novelty", "Rejection Risk", "Final Score", "Candidate ranking",
    "Ontology candidate trace", "Ontology exclusion trace", "Semantic inferences",
    "Evidence used", "Weights", "Ontology version", "Ranking version",
    "Recommendation outcome",
  ]) {
    assert.ok(panel.includes(label), `${label} must be present`);
  }
  assert.match(educatorDashboard, /NEXT_PUBLIC_ENABLE_RESEARCH_DEBUG/);
  assert.match(educatorDashboard, /searchParams\.get\("research"\)/);
  assert.match(panel, /data-research-debug="true"/);
});
