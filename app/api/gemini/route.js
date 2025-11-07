// Server route for /api/gemini
// Note: Next.js app route handlers should not use the "use server" directive.
import fs from 'fs'
import path from 'path'

const TOOLS_DIR = path.resolve(process.cwd(), 'database', 'tools')
import { GoogleGenAI } from "@google/genai";

// POST /api/gemini
export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "missing query" }), {
        status: 400,
      });
    }

    // Load tools from database/tools folder and build a short tools catalog to provide context to the model.
    let toolsFiles = []
    try {
      toolsFiles = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith('.json'))
    } catch (e) {
      toolsFiles = []
    }

    const toolsData = []
    for (const f of toolsFiles) {
      try {
        const raw = fs.readFileSync(path.join(TOOLS_DIR, f), 'utf8')
        toolsData.push(JSON.parse(raw))
      } catch (e) {
        // ignore broken file
      }
    }

    // Build a short tools catalog to provide context to the model. Include explicit 'intents' and 'keywords' so the model can match semantics.
    const catalog = toolsData.map((t) => ({
      id: t.id,
      name: t.name,
      tags: t.tags,
      primary_intent: t.primary_intent || null,
      intents: t.intents || [],
      keywords: t.keywords || [],
      summary: t.summary,
    }));

    const prompt = `You are given a user query and a catalog of tools. Each catalog item includes id, name, tags, primary_intent, intents, keywords, and a short summary.

Task:
1) Determine the user's primary intent from this list: [writing, image, automation, video, coding, research, education]. Pick exactly one primary intent.
2) Apply these special rules:
   - For education/study queries: Return tools with "education" tag/intent OR research-focused tools that aid learning
   - For image/photo queries: Return tools with "image" primary_intent OR tools specifically good at photo editing/generation
   - For other intents: Return tools whose primary_intent matches the identified intent
3) Return a JSON array (up to 6 items) of objects with keys: id, name, score (0-1), reason (one short sentence why it matches). Order by relevance.
4) For study-related queries, prioritize tools that offer interactive learning or practice features.

Catalog: ${JSON.stringify(catalog)}
User query: "${query.replace(/"/g, '\\"')}"

Respond ONLY with the JSON array and nothing else. If no catalog items match the identified primary intent, return an empty JSON array [].`;

    // Simple local intent classifier (fallback / fast path) - prefer deterministic matching when possible
    function classifyIntentFromQuery(q) {
      // First check for key phrases before tokenizing
      const q_lower = q.toLowerCase();
      const keyPhrases = [
        "ai tools",
        "teaching tools",
        "for teaching",
        "for students",
        "in classroom",
        "ai assistant",
        "for school",
        "homework help",
        "study aid",
        "ai tutor",
        "ai tutoring",
        "ai education",
        "ai learning",
        "ai art",
        "ai image",
        "ai music",
        "ai video",
        "for work",
        "for business",
        "productivity tools",
        "email writing",
        "workflow automation",
        "scheduling",
      ];
      
      let foundPhrases = keyPhrases.filter(phrase => q_lower.includes(phrase));
      
      // Then get individual tokens
      const tokens = q_lower
        .split(/[^\w]+/)
        .filter(Boolean)
        .concat(foundPhrases);
      
      const stopwords = new Set([
        "me",
        "my",
        "we",
        "you",
        "your",
        "he",
        "she",
        "it",
        "they",
        "them",
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "if",
        "that",
        "this",
        "these",
        "those",
        "to",
        "of",
        "in",
        "on",
        "with",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
      ]);
      const filtered = tokens.filter((t) => !stopwords.has(t));
      const tset = new Set(filtered);
      
      // Check if query contains AI-related terms
      const hasAIContext = filtered.some(t => 
        t.includes('ai') || t.includes('artificial') || t.includes('intelligence') || 
        t === 'tool' || t === 'tools'
      );
      
      const map = {
        writing: [
          "write",
          "writing",
          "email",
          "mail",
          "compose",
          "message",
          "draft",
          "letter",
          "story",
          "article",
          "edit",
          "proofread",
          "blog",
          "document",
          "report",
          "documentation",
          "essay",
          "paper",
          "paragraph",
          "grammar",
          "rewrite",
          "summarize",
          "summary",
        ],
        image: [
          "image",
          "photo",
          "picture",
          "draw",
          "design",
          "illustration",
          "visual",
          "photoshop",
          "edit",
          "editing",
          "generate",
          "ai art",
          "artwork",
          "graphics",
          "logo",
          "sketch",
          "drawing",
          "digital art",
          "painting",
          "visual",
          "illustration",
          "illustrate",
          "photography",
          "photo editing",
          "picture editing",
        ],
        automation: [
          "automate",
          "automation",
          "workflow",
          "zap",
          "integrate",
          "integration",
          "bot",
          "robot",
          "script",
          "task",
          "process",
          "process automation",
          "if this then that",
          "trigger",
          "action",
        ],
        video: ["video", "filming", "videos", "record", "videoing", "recording", "edit", "editing", "clip", "footage", "movie", "animation", "record", "clip", "rendering", 
          "shorts", "footage", "motion", "motion picture", "animation", "record", "videography", "videoing", "cinematography"
        ],
        coding: ["code", "coding", "debug", "program", "debugging", "developing", "software", "build", "application", "script", "coding language", "function", "procedure", "full stack", "backend", "frontend"],
        research: [
          "research",
          "summarize",
          "summary",
          "analyze",
          "notes",
          "study",
          "studying",
          "review",
          "understand",
          "comprehend",
          "learn",
          "comprehend",
          "investigate",
          "explore",
          "gather",
          "information",
          "data",
          "facts",
          "figures",
          "statistics",
          "insights",
          "knowledge",
          "paper",
          "article",
          "source",
          "citation",
          "reference",
          "bibliography",
          "literature",
          "survey",
          "notes",
          "review",
        ],
        education: [
          "teach",
          "teaching",
          "learn",
          "learning",
          "student",
          "teacher",
          "classroom",
          "lesson",
          "education",
          "tutor",
          "tutoring",
          "quiz",
          "assessment",
          "school",
          "study",
          "studying",
          "homework",
          "practice",
          "exercises",
          "lesson plan",
          "curriculum",
          "syllabus",
          "practice problems",
          "interactive learning",
          "educational games",
          "flashcards",
          "educational videos",
          "e-learning",
          "online course",
          "virtual classroom",
          "note taking",
          "tutoring",
          "test prep",
          "exam preparation",
          "learning tools",
          "study aids",
          "academic support",
          "learning resources",
        ],
      };
      for (const intent of Object.keys(map)) {
        if (map[intent].some((w) => tset.has(w))) return intent;
      }
      return null;
    }

    const detectedIntent = classifyIntentFromQuery(query);

    // If we can deterministically map to an intent, return local matching tools immediately (guarantees correct semantics)
    if (detectedIntent) {
      const matched = toolsData
        .filter((t) => {
          // For education/teaching queries, include tools that match either education intent or have education tags
          if (detectedIntent === 'education') {
            return (t.primary_intent === 'education' || 
                   t.intents?.includes('education') || 
                   t.tags?.includes('education') ||
                   t.tags?.includes('teaching'));
          }
          // For other intents, use standard intent matching
          return (t.primary_intent || t.intents || []).includes(detectedIntent);
        })
        .map((t) => ({
          id: t.id,
          name: t.name,
          score: 1.0,
          reason: `Matches intent ${detectedIntent}`,
        }));
      return new Response(JSON.stringify(matched), { status: 200 });
    }

// If no intent confidently detected, run keyword scoring before Gemini
// Quick keyword-based matching (runs before Gemini for fast results)
const qLower = query.toLowerCase();
const queryWords = qLower.split(/[^\w]+/).filter(Boolean);

const quickMatches = toolsData
  .map((tool) => {
    const text = [
      tool.name,
      tool.about,
      tool.summary,
      (tool.tags || []).join(" "),
      (tool.keywords || []).join(" "),
      tool.details || ""
    ].join(" ").toLowerCase();

    let score = 0;
    for (const word of queryWords) {
      if (text.includes(word)) score += 1;
      else if (word.endsWith("s") && text.includes(word.slice(0, -1))) score += 0.5;
      else if (word.endsWith("ing") && text.includes(word.slice(0, -3))) score += 0.5;
    }

    return { id: tool.id, name: tool.name, score, summary: tool.summary, tags: tool.tags };
  })
  .filter((t) => t.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 6);

// If local keyword matches found, return them immediately
if (quickMatches.length > 0) {
  return new Response(JSON.stringify(quickMatches), { status: 200 });
}
    // Only now use Gemini if local logic found nothing suitable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // no API key configured
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not set on server" }),
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = resp?.text ?? "";

    // Try to parse model output as JSON
    try {
      const parsed = JSON.parse(text);
      // sanitize to only include known tools
      const sanitized = Array.isArray(parsed)
        ? parsed
            .map((p) => ({
              id: p.id,
              name: p.name,
              score: typeof p.score === "number" ? p.score : 0,
              reason: p.reason || "",
              tags: toolsData.find((t) => t.id === p.id)?.tags || [],
              summary: toolsData.find((t) => t.id === p.id)?.summary || "",
            }))
            .filter((it) => Boolean(it.id))
        : [];

      return new Response(JSON.stringify(sanitized), { status: 200 });
    } catch (e) {
      // parsing failed: fallback to simple keyword scoring server-side
      const q = query.trim().toLowerCase();
      const tokens = q.split(/[^\w]+/).filter(Boolean);
      
      // Check if query is education-related
      const educationTokens = ["teach", "teaching", "learn", "learning", "student", "teacher", "classroom", "lesson", "education", "tutor", "tutoring", "quiz", "assessment", "school"];
      const isEducationQuery = tokens.some(token => 
        educationTokens.some(edu => 
          edu === token || 
          token.startsWith(edu) || 
          edu.startsWith(token)
        )
      );

      const scored = toolsData
        .map((t) => {
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
          let score = 0;
          
          // If education query, only score education tools
          if (isEducationQuery) {
            if (!t.tags.includes("education") && t.primary_intent !== "education") {
              return { id: t.id, name: t.name, score: 0, tags: t.tags, summary: t.summary };
            }
          }

          for (const tk of tokens) {
            if (hay.includes(tk)) score += 1;
            if (tk.endsWith("e") && hay.includes(tk.slice(0, -1))) score += 0.5;
            if (tk.endsWith("ing") && hay.includes(tk.slice(0, -3)))
              score += 0.5;
          }
          return {
            id: t.id,
            name: t.name,
            score,
            tags: t.tags,
            summary: t.summary,
          };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      return new Response(JSON.stringify(scored), { status: 200 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
