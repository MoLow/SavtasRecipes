import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getGeminiClient } from "../utils/api-clients.ts";
import { cached } from "../utils/cache.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/illustrator-system.md");
const DATA_DIR = resolve(__dirname, "../../../data");
const ILLUSTRATIONS_DIR = resolve(DATA_DIR, "illustrations");

export async function generateIllustration(
  recipeId: string,
  title: string,
  description: string
): Promise<string> {
  // Check if illustration already exists (from a previous run)
  mkdirSync(ILLUSTRATIONS_DIR, { recursive: true });
  for (const ext of ["png", "webp"]) {
    const existing = resolve(ILLUSTRATIONS_DIR, `${recipeId}.${ext}`);
    if (existsSync(existing)) {
      return `illustrations/${recipeId}.${ext}`;
    }
  }

  const cacheKey = createHash("sha256")
    .update(`${title}:${description}`)
    .digest("hex")
    .slice(0, 16) + ":illustrator";

  // Cache the raw image data + mime type, then write the file
  const { data, mimeType } = await cached("illustrator", cacheKey, async () => {
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

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
      throw new Error("Nano Banana Pro returned no image");
    }

    return {
      data: imagePart.inlineData.data!,
      mimeType: imagePart.inlineData.mimeType!,
    };
  });

  const ext = mimeType === "image/png" ? "png" : "webp";
  const filename = `${recipeId}.${ext}`;
  const outputPath = resolve(ILLUSTRATIONS_DIR, filename);
  writeFileSync(outputPath, Buffer.from(data, "base64"));

  return `illustrations/${filename}`;
}
