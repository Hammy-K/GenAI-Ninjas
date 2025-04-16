
import OpenAI from "openai";

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    threatening: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
  };
}

export async function moderateContent(text: string, openai: OpenAI): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: {
        hate: result.categories.hate,
        threatening: result.categories["violence/threatening"],
        selfHarm: result.categories["self-harm"],
        sexual: result.categories.sexual,
        violence: result.categories.violence
      }
    };
  } catch (error) {
    console.error('Moderation error:', error);
    return {
      flagged: false,
      categories: {
        hate: false,
        threatening: false,
        selfHarm: false,
        sexual: false,
        violence: false
      }
    };
  }
}
