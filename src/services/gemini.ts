import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type DrawingStyle = 
  | "coloring-page" 
  | "cartoon" 
  | "realistic-outline"
  | "educational-worksheet"
  | "thick-outline"
  | "advanced-detailed";

export async function brainstormIdeas(): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 5 fun, creative, and specific drawing ideas for kids. Each idea should be a short phrase (max 5-7 words). Think of animals, space, mythology, or everyday magic. Return as a clean JSON array of strings.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Brainstorm failed:", error);
    return [
      "A dinosaur with a jetpack",
      "An octopus eating ice cream",
      "A castle made of marshmallows",
      "A cat riding a flying carpet",
      "A robot garden of metallic flowers"
    ];
  }
}

export async function refinePrompt(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Take this simple drawing prompt: "${prompt}". Expand it into a more descriptive, fun, and artistic scene suitable for a child's coloring book or cartoon. Make it imaginative but keep the core subject clear. Maximum 15 words.`,
    });
    return response.text || prompt;
  } catch (error) {
    return prompt;
  }
}

export async function generateDrawing(prompt: string, style: DrawingStyle) {
  let styleInstruction = "";
  
  switch (style) {
    case "coloring-page":
      styleInstruction = "a simple black and white outline coloring book page for children, thick clean black lines, white background, no shading, easy to color";
      break;
    case "cartoon":
      styleInstruction = "a friendly cartoon illustration for kids, bold colors, simple shapes, white background";
      break;
    case "realistic-outline":
      styleInstruction = "a clean black and white line art drawing, crisp edges, white background";
      break;
    case "educational-worksheet":
      styleInstruction = "educational tracing worksheet style, dotted lines for some parts, clear simple subject, high contrast black and white";
      break;
    case "thick-outline":
      styleInstruction = "extremely bold thick black outlines for toddlers, very simple shapes, no small details, coloring book style";
      break;
    case "advanced-detailed":
      styleInstruction = "intricate detailed coloring book page for adults/teens, complex patterns, highly detailed line work, professional ink drawing";
      break;
  }

  const fullPrompt = `${styleInstruction}. Subject: ${prompt}`;

  try {
    // Attempting real image generation with Gemini 2.5 Flash Image
    // This is the "Real Integration" part.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        }
      }
    });

    // Extract the image part from the response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64Data}`;
      }
    }

    // Fallback if no image part found (should not happen if model works)
    throw new Error("No image generated");

  } catch (error) {
    console.warn("Gemini Image Gen failed or not available, using fallback:", error);
    
    // FALLBACK: Use Pollinations AI for high-quality demo generations if Gemini 2.5 is unavailable or rate limited
    // This ensures the user has a working app even if the specific experimental model is unstable.
    await new Promise(resolve => setTimeout(resolve, 2000));
    const cleanPrompt = encodeURIComponent(fullPrompt.replace(/[^\w\s]/gi, ''));
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?seed=${seed}&width=900&height=1200&nologo=true`;
  }
}

