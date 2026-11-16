import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// makeitours-app#178: the app's AI processing notice links #ai-processing and names
// OpenRouter (HostedAIConsentWording in makeitours-app). Change both together.
test("privacy page names the AI services the app's permission notice names", () => {
  const page = readFileSync(new URL("../privacy.html", import.meta.url), "utf8");
  assert.match(page, /<h3 id="ai-processing">AI processing and design search<\/h3>/);
  const section = page.slice(page.indexOf('id="ai-processing"'), page.indexOf("<h3", page.indexOf('id="ai-processing"') + 1));
  const text = section.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.match(text, /to OpenRouter, which passes them to the AI model providers we choose/);
  assert.match(text, /asks for your permission before your first managed request/);
  assert.match(text, /Account Management, under Privacy/);
  assert.doesNotMatch(page, /platform-selected AI provider/);
});
