import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getGeminiClient } from "../utils/api-clients.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/illustrator-system.md");
const DATA_DIR = resolve(__dirname, "../../../data");
const ILLUSTRATIONS_DIR = resolve(DATA_DIR, "illustrations");

export async function generateIllustration(
  recipeId: string,
  title: string,
  description: string
): Promise<string> {
  const client = getGeminiClient();
  const stylePrompt = readFileSync(PROMPT_PATH, "utf-8");

  const prompt = `${stylePrompt}\n\nDish: ${title}\nDescription: ${description}`;

  const response = await client.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["image", "text"],
    },
  });

  // Extract image from response
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
    throw new Error("Nano Banana Pro returned no image");
  }

  const imageData = Buffer.from(imagePart.inlineData.data!, "base64");

  // Save as the original format returned by the API
  mkdirSync(ILLUSTRATIONS_DIR, { recursive: true });
  const ext =
    imagePart.inlineData.mimeType === "image/png" ? "png" : "webp";
  const filename = `${recipeId}.${ext}`;
  const outputPath = resolve(ILLUSTRATIONS_DIR, filename);
  writeFileSync(outputPath, imageData);

  return `illustrations/${filename}`;
}
