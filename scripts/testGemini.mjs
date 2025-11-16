import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });
    // Print only the model text
    console.log("MODEL_OUTPUT_START");
    console.log(response.text);
    console.log("MODEL_OUTPUT_END");
  } catch (err) {
    console.error("ERROR_START");
    console.error(err);
    console.error("ERROR_END");
    process.exitCode = 1;
  }
}

main();
