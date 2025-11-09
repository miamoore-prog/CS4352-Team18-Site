import fs from "fs/promises";
import path from "path";

const STORE = path.resolve(process.cwd(), "data", "reviews-store.json");

async function run() {
  const raw = await fs.readFile(STORE, "utf-8");
  const store = JSON.parse(raw);
  let touched = 0;
  let entries = 0;

  for (const toolId of Object.keys(store)) {
    const arr = store[toolId];
    if (!Array.isArray(arr)) continue;
    for (const rev of arr) {
      entries += 1;
      rev.history = Array.isArray(rev.history) ? rev.history : [];
      // if history is empty, add an initial entry mirroring the review
      if (rev.history.length === 0) {
        rev.history.push({
          date: rev.date || new Date().toISOString(),
          text: rev.text || "",
          rating: typeof rev.rating !== "undefined" ? rev.rating : null,
        });
        touched++;
        continue;
      }
      let changedThis = false;
      rev.history = rev.history.map((h) => {
        if (typeof h.rating === "undefined") {
          changedThis = true;
          return {
            ...h,
            rating: typeof rev.rating !== "undefined" ? rev.rating : null,
          };
        }
        return h;
      });
      if (changedThis) touched++;
    }
  }

  await fs.writeFile(STORE, JSON.stringify(store, null, 2), "utf-8");
  console.log(
    `Backfill complete. Reviews checked: ${entries}. Reviews touched: ${touched}. File: ${STORE}`
  );
}

run().catch((err) => {
  console.error("Error running backfill:", err);
  process.exitCode = 2;
});
