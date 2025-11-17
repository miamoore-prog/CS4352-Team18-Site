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

  const prompt = `You are a tool recommendation system. Analyze the user's query and match it semantically to relevant tools.

User Query: "${query}"

Tool Catalog:
${JSON.stringify(catalog, null, 2)}

Instructions:
- Match tools based on their CAPABILITIES, not just exact keyword matches
- Consider synonyms and related concepts (e.g., "create image" → image generation tools)
- Use the tool's intents, keywords, tags, and summary for matching
- Prioritize tools that directly fulfill the user's goal
- Return up to 6 most relevant tools, ordered by relevance

Examples:
- "create an image" should match tools with intent: "image" or tags: ["image", "ai"]
- "write email" should match tools for email composition or writing assistants
- "automate workflow" should match automation and integration tools

Return ONLY a JSON array with this structure:
[
  {
    "id": "tool-id",
    "name": "Tool Name",
    "score": 0.95,
    "reason": "brief explanation"
  }
]`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      // model: "gemini-2.0-flash", // rate 15
      model: "gemini-2.5-flash-lite", // rate 1k
      // model: "gemini-2.0-flash-lite", // rate 30
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
