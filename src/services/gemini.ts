export type DrawingStyle = 
  | "coloring-page" 
  | "cartoon" 
  | "realistic-outline"
  | "educational-worksheet"
  | "thick-outline"
  | "advanced-detailed";

export async function brainstormIdeas(): Promise<string[]> {
  try {
    const res = await fetch("/api/ai/brainstorm");
    return await res.json();
  } catch (error) {
    return [
      "A dinosaur with a jetpack",
      "An octopus eating ice cream",
      "A castle made of marshmallows"
    ];
  }
}

export async function refinePrompt(prompt: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.refined;
  } catch (error) {
    return prompt;
  }
}

export async function generateDrawing(prompt: string, style: DrawingStyle): Promise<string> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, style }),
  });
  const data = await res.json();
  return data.url;
}

