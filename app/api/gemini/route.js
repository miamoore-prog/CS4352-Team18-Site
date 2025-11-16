import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const TOOLS_DIR = path.resolve(process.cwd(), "database", "tools");

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "missing query" }), {
        status: 400,
      });
    }

    const tools = loadTools();

    // Use Gemini AI for all searches to get semantic, contextual results
    const geminiMatches = await searchWithGemini(query, tools);
    return new Response(JSON.stringify(geminiMatches), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}

function loadTools() {
  const tools = [];
  try {
    const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(TOOLS_DIR, file), "utf8");
        tools.push(JSON.parse(content));
      } catch (e) {
        // skip broken files
      }
    }
  } catch (e) {
    // tools directory doesn't exist
  }
  return tools;
}

async function searchWithGemini(query, tools) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const catalog = tools.map((t) => ({
    id: t.id,
    name: t.name,
    tags: t.tags,
    summary: t.summary,
    intents: t.intents || [],
    keywords: t.keywords || [],
  }));

  const prompt = `Given this user query: "${query}"

And this catalog of tools:
${JSON.stringify(catalog, null, 2)}

Return the top 6 most relevant tools as a JSON array. Each item should have:
- id: the tool's id
- name: the tool's name
- score: relevance from 0 to 1
- reason: brief explanation of why it matches

Return only the JSON array, nothing else.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response?.text ?? "";

    // Strip markdown code fences if present
    text = text
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const tool = tools.find((t) => t.id === item.id);
        if (!tool) return null;

        return {
          id: item.id,
          name: item.name,
          score: item.score || 0,
          reason: item.reason || "",
          tags: tool.tags || [],
          summary: tool.summary || "",
        };
      })
      .filter((item) => item !== null);
  } catch (e) {
    // if gemini fails, return empty array
    return [];
  }
}
