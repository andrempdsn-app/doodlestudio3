import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Help debug missing keys in logs
if (!process.env.GEMINI_API_KEY) {
  console.error("WARNING: GEMINI_API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook (needs raw body)
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Payment successful for session: ${session.id}`);
        // Here you would normally update your database
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // AI Routes (Secure Backend)
  app.get("/api/ai/brainstorm", async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Generate 5 fun, creative, and specific drawing ideas for kids. Each idea should be a short phrase (max 5-7 words). Return as a clean JSON array of strings.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (error: any) {
      console.error("Brainstorm failed:", error);
      res.json(["Dinosaur with a jetpack", "Octopus eating ice cream", "Castle made of marshmallows"]);
    }
  });

  app.post("/api/ai/refine", async (req, res) => {
    const { prompt } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Take this simple drawing prompt: "${prompt}". Expand it into a more descriptive, fun scene for a kids coloring book. Max 15 words.`,
      });
      res.json({ refined: response.text || prompt });
    } catch (error: any) {
      res.json({ refined: prompt });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, style } = req.body;
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
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "3:4",
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return res.json({ url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
        }
      }
      throw new Error("No image generated");
    } catch (error: any) {
      console.warn("Generation failed, using fallback:", error.message);
      const cleanPrompt = encodeURIComponent(fullPrompt.replace(/[^\w\s]/gi, ''));
      const seed = Math.floor(Math.random() * 1000000);
      res.json({ url: `https://image.pollinations.ai/prompt/${cleanPrompt}?seed=${seed}&width=900&height=1200&nologo=true` });
    }
  });

  // API: Create Stripe Checkout Session
  app.post("/api/stripe/create-checkout", async (req, res) => {
    const { priceId, successUrl, cancelUrl } = req.body;

    console.log(`Creating checkout session for priceId: ${priceId}`);

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId. Please check your environment variables." });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
