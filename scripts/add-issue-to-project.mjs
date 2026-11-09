// D157 (makeitours#92): add a new public issue to Project #2 and set Source, Report type, Area
// and Platform from the issue form. Inputs come from the environment only; the issue text is
// parsed as data and never executed.
import { formValue, typeFromLabels } from "./issue-form.mjs";

const token = process.env.GITHUB_TOKEN;
const issueNodeId = process.env.ISSUE_NODE_ID;
if (!token || !issueNodeId) {
  console.log("PROJECT_REPORTS_TOKEN or the issue id is missing; nothing to do.");
  process.exit(0);
}

async function graphql(query, variables) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "user-agent": "makeitours-website-add-to-project" },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (!response.ok || result.errors?.length) throw new Error(`GitHub GraphQL failed: ${response.status} ${JSON.stringify(result.errors ?? [])}`);
  return result.data;
}

const project = (await graphql(
  `query { user(login: "brandon-benge") { projectV2(number: 2) { id fields(first: 50) { nodes {
    ... on ProjectV2FieldCommon { id name } ... on ProjectV2SingleSelectField { options { id name } } } } } } }`, {},
)).user.projectV2;
const field = (name) => project.fields.nodes.find((f) => f?.name === name);

const item = (await graphql(
  `mutation($p: ID!, $c: ID!) { addProjectV2ItemById(input: { projectId: $p, contentId: $c }) { item { id } } }`,
  { p: project.id, c: issueNodeId },
)).addProjectV2ItemById.item.id;

const body = process.env.ISSUE_BODY ?? "";
let labels = [];
try { labels = JSON.parse(process.env.ISSUE_LABELS ?? "[]"); } catch { labels = []; }
const wanted = [
  ["Status", "Todo"],
  ["Source", "Public issue"],
  ["Report type", typeFromLabels(labels)],
  ["Area", formValue(body, "Area")],
  ["Platform", formValue(body, "Platform")],
];
for (const [name, option] of wanted) {
  const f = field(name);
  const optionId = f?.options?.find((o) => o.name === option)?.id;
  if (!f || !optionId) continue;
  await graphql(
    `mutation($p: ID!, $i: ID!, $f: ID!, $o: String!) { updateProjectV2ItemFieldValue(input: {
      projectId: $p, itemId: $i, fieldId: $f, value: { singleSelectOptionId: $o } }) { clientMutationId } }`,
    { p: project.id, i: item, f: f.id, o: optionId },
  );
}
const version = formValue(body, "App version");
const versionField = field("App version");
if (version && versionField && version.toLowerCase() !== "n/a") {
  await graphql(
    `mutation($p: ID!, $i: ID!, $f: ID!, $t: String!) { updateProjectV2ItemFieldValue(input: {
      projectId: $p, itemId: $i, fieldId: $f, value: { text: $t } }) { clientMutationId } }`,
    { p: project.id, i: item, f: versionField.id, t: version.slice(0, 64) },
  );
}
console.log(`Added ${issueNodeId} to Project #2 as ${item}.`);
