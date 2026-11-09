// D157 (makeitours#92): read the public issue form's answers.
export function formValue(body, heading) {
  const match = new RegExp(`^### ${heading}\\s*\\n+([^\\n]+)`, "m").exec(body ?? "");
  const value = match?.[1]?.trim();
  return value && value !== "_No response_" ? value : null;
}

export function typeFromLabels(labels) {
  if (labels.includes("type:bug")) return "Bug";
  if (labels.includes("type:feature")) return "Feature idea";
  if (labels.includes("question")) return "Question";
  return null;
}
