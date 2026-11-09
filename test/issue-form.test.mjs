import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formValue, typeFromLabels } from "../scripts/issue-form.mjs";

// D157 (makeitours#92): public issue forms feed Project #2 fields.
test("reads the form's answers the way GitHub writes them", () => {
  const body = "### Area\n\nViewing the model drawings or exports\n\n### Platform\n\nMac\n\n### App version\n\n_No response_\n\n### What happened, and what did you expect?\n\nIt froze.";
  assert.equal(formValue(body, "Area"), "Viewing the model drawings or exports");
  assert.equal(formValue(body, "Platform"), "Mac");
  assert.equal(formValue(body, "App version"), null);
  assert.equal(formValue(undefined, "Area"), null);
  assert.equal(typeFromLabels(["type:bug"]), "Bug");
  assert.equal(typeFromLabels(["question"]), "Question");
  assert.equal(typeFromLabels([]), null);
});

test("every form requires Area, Platform, App version and a description, and warns it is public", () => {
  for (const form of ["bug", "feature", "question"]) {
    const text = readFileSync(new URL(`../.github/ISSUE_TEMPLATE/${form}.yml`, import.meta.url), "utf8");
    for (const id of ["area", "platform", "app_version", "description"]) assert.match(text, new RegExp(`id: ${id}[\\s\\S]*?required: true`));
    assert.match(text, /This is a \*\*public\*\* page/);
  }
  const config = readFileSync(new URL("../.github/ISSUE_TEMPLATE/config.yml", import.meta.url), "utf8");
  assert.match(config, /blank_issues_enabled: false/);
  assert.match(config, /makeitours-support@bengesoftwarellc\.com/);
});
