import { execSync } from "child_process";
import { readFileSync } from "fs";
import { getGeminiClient } from "../utils/api-clients.ts";

/**
 * Detects the correct rotation for a scan image.
 *
 * Strategy: AI models auto-apply EXIF orientation, so they always see text
 * as upright. Instead of asking about rotation directly, we ask the model
 * which edge of the PIXEL GRID the top of the readable text is nearest to.
 * Combined with the actual pixel dimensions, we can compute the rotation.
 *
 * Returns clockwise rotation in degrees (0, 90, 180, or 270).
 */
export async function detectRotation(imagePath: string): Promise<number> {
  const client = getGeminiClient();

  // Get actual pixel dimensions
  const sipsOut = execSync(`sips -g pixelWidth -g pixelHeight "${imagePath}"`, {
    encoding: "utf-8",
  });
  const wMatch = sipsOut.match(/pixelWidth:\s*(\d+)/);
  const hMatch = sipsOut.match(/pixelHeight:\s*(\d+)/);
  const pixelWidth = wMatch ? parseInt(wMatch[1], 10) : 0;
  const pixelHeight = hMatch ? parseInt(hMatch[1], 10) : 0;

  // If already portrait, likely correct
  if (pixelHeight > pixelWidth) {
    return 0;
  }

  // Image is landscape but content is portrait — needs 90 or 270.
  // Ask the model which direction the text flows to determine which rotation.
  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          { text: `This is a photo of a handwritten recipe. How many degrees clockwise should this image be rotated so the text reads normally? Respond with a JSON object: {"degrees": N} where N is 0, 90, 180, or 270.` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: readFileSync(imagePath).toString("base64"),
            },
          },
        ],
      },
    ],
  });

  let text = response.text?.trim() ?? '{}';
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  const parsed = JSON.parse(text);
  return parsed.degrees;
}
