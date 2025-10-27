import toolsData from "../data/tools.json" assert { type: "json" };

function filterTools(query) {
  const q = query.trim().toLowerCase();
  if (!q) return toolsData;
  const tokens = q.split(/[^\w]+/).filter(Boolean);
  if (tokens.length === 0) return toolsData;

  return toolsData.filter((t) => {
    const hay = [
      t.name,
      t.about,
      t.summary,
      t.tags.join(" "),
      t.details,
      (t.howTo || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    for (const tk of tokens) {
      if (hay.includes(tk)) return true;
      if (tk.endsWith("e") && hay.includes(tk.slice(0, -1))) return true;
      if (tk.endsWith("ing") && hay.includes(tk.slice(0, -3))) return true;
    }
    return false;
  });
}

const queries = [
  "i want ai tools that helps me write email",
  "create an image of a sunset",
  "automate my workflow between apps",
  "edit video footage quickly",
];

for (const q of queries) {
  const res = filterTools(q);
  console.log("Query:", q);
  console.log(
    "Matches:",
    res.map((r) => r.name)
  );
  console.log("---");
}
