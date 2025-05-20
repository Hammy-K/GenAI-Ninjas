import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function isContentSafe(input: string): Promise<boolean> {
  try {
    const moderation = await openai.moderations.create({
      input,
    });

    const [result] = moderation.results;

    console.log("##########################");
    console.log("Moderation result:", result.flagged);
    console.log("##########################");

    return !result.flagged;
  } catch (err) {
    console.error("Moderation API error:", err);
    return false; // default to unsafe if moderation fails
  }
}
