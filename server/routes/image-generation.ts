import type { Express } from "express";
import OpenAI from "openai";
import { db } from "../db";
import { generatedImages } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

export function registerImageGenerationRoutes(app: Express) {
  // POST /api/image-generation
  app.post("/api/image-generation", async (req, res) => {
    console.log("📸 Image generation request received");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
      const {
        prompt,
        size = "1024x1024",
        referenceImageUrl,
        userEmail,
      } = req.body;

      // Validate required fields
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        console.error("❌ Validation error: Missing prompt");
        return res.status(400).json({
          ok: false,
          error: "البرومبت مطلوب",
        });
      }

      if (!userEmail || typeof userEmail !== "string") {
        console.error("❌ Validation error: Missing email");
        return res.status(400).json({
          ok: false,
          error: "البريد الإلكتروني مطلوب",
        });
      }

      console.log("✅ Validation passed");
      console.log("📧 Email:", userEmail);
      console.log("📝 Prompt:", prompt);
      console.log("🖼️  Reference image:", referenceImageUrl);

      let requestBody: any = {
        model: "gpt-image-1",
        prompt: `Manga/anime style illustration: ${prompt}. Create in black and white manga art style with clear linework, expressive characters, and dynamic composition.`,
        n: 1,
        size: size as "1024x1024",
        quality: "medium",
      };

      // If we have a reference image, use the edits endpoint
      if (referenceImageUrl) {
        console.log("⏳ Loading reference image...");
        const imageResponse = await fetch(referenceImageUrl);
        const imageBlob = await imageResponse.blob();
        console.log("✅ Reference image loaded");

        console.log("🎨 Sending request with reference image");
        console.log("🤖 Calling OpenAI Image Edits API...");

        // Create FormData with proper multipart format
        const formData = new FormData();
        formData.append("model", "gpt-image-1");
        formData.append("image[]", imageBlob, "reference.png");
        formData.append(
          "prompt",
          `Using this reference image as style inspiration, create: ${prompt}. Match the manga/anime art style, character design, and visual aesthetic shown in the reference.`,
        );
        formData.append("n", "1");
        formData.append("size", size);
        formData.append("quality", "medium");
        formData.append("input_fidelity", "high");

        const apiResponse = await fetch(
          "https://api.openai.com/v1/images/edits",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: formData,
          },
        );

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          console.error(
            "❌ OpenAI API Error:",
            JSON.stringify(errorData, null, 2),
          );
          throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }

        var response = await apiResponse.json();
        console.log("✅ API Response received");
      } else {
        // No reference image, use regular generation
        console.log("🎨 Sending request without reference image");
        console.log("🤖 Calling OpenAI Images Generate API...");

        var response = await openai.images.generate(requestBody);
        console.log("✅ API Response received");
      }

      console.log("✅ OpenAI API response received");

      // Extract image from response (works for both edits and generations)
      const image = response.data[0];

      if (!image) {
        console.error("❌ No image in response");
        return res.json({
          ok: false,
          error: "لم يتم إنشاء صورة",
        });
      }

      console.log("✅ Image found in response");

      let base64Image: string;
      let dataUrl: string;

      // GPT Image 1 always returns b64_json
      if (image.b64_json) {
        console.log("📦 Got base64 directly from API");
        base64Image = image.b64_json;
        dataUrl = `data:image/png;base64,${base64Image}`;
      } else {
        console.error("❌ No b64_json in response");
        return res.json({
          ok: false,
          error: "لم يتم إنشاء صورة",
        });
      }

      console.log("📦 Data URL created, length:", dataUrl.length);

      // Save to database
      console.log("💾 Saving to database...");
      const [savedImage] = await db
        .insert(generatedImages)
        .values({
          email: userEmail,
          prompt: prompt,
          imageDataUrl: dataUrl,
          referenceImageUrl: referenceImageUrl || null,
          size: size,
          missionType: "pengy_redemption",
        })
        .returning();

      console.log("✅ Image saved to database:", savedImage.id);

      return res.json({
        ok: true,
        images: [
          {
            b64: base64Image,
            dataUrl: dataUrl,
            mimeType: "image/png",
          },
        ],
        imageId: savedImage.id,
      });
    } catch (error: any) {
      console.error("💥 Image generation error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return res.status(500).json({
        ok: false,
        error: `فشل توليد الصور: ${error.message}`,
      });
    }
  });

  // GET /api/image-generation/user/:email
  // Fetch user's generated images
  app.get("/api/image-generation/user/:email", async (req, res) => {
    try {
      const { email } = req.params;

      const images = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.email, email))
        .orderBy(desc(generatedImages.createdAt))
        .limit(50);

      return res.json({
        ok: true,
        images: images,
      });
    } catch (error: any) {
      console.error("Failed to fetch images:", error);
      return res.status(500).json({
        ok: false,
        error: "فشل جلب الصور",
      });
    }
  });
}
