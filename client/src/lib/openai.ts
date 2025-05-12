import { apiRequest } from "./queryClient";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type TextGenerationOptions = {
  prompt: string;
  maxTokens?: number;
  messageHistory?: Message[];
};

type CompletionResponse = {
  text: string;
  error?: string;
};

type PromptAnalysisResponse = {
  score: number;
  feedback: string;
  improvement: string;
};

type ProjectIdeaResponse = {
  title: string;
  description: string;
  steps: string[];
  tools: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
};

export async function generateText(
  options: TextGenerationOptions,
): Promise<CompletionResponse> {
  try {
    // Use the new TryAI assistant endpoint which uses the specific assistant ID
    const response = await apiRequest(
      "POST",
      "/api/ai/text/try-ai-assistant",
      options,
    );
    const data = await response.json();
    return { text: data.text, error: data.error };
  } catch (error) {
    console.error("Error generating text:", error);

    // Try falling back to the original endpoint if the assistant API fails
    try {
      console.log(
        "TryAI Assistant API failed, falling back to standard endpoint",
      );
      const fallbackResponse = await apiRequest(
        "POST",
        "/api/ai/text",
        options,
      );
      const fallbackData = await fallbackResponse.json();
      return { text: fallbackData.text };
    } catch (fallbackError) {
      console.error("Both text generation endpoints failed:", fallbackError);
      return {
        text: "عذرًا، حدث خطأ في التواصل مع د. بنجي. هل يمكنك إعادة المحاولة؟",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

/**
 * Image generation functionality has been removed
 * This comment block replaces the generateImage function
 */

export async function analyzePrompt(
  prompt: string,
): Promise<PromptAnalysisResponse> {
  try {
    const response = await apiRequest("POST", "/api/ai/analyze-prompt", {
      prompt,
    });
    return await response.json();
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    return {
      score: 0,
      feedback: "حدث خطأ في تحليل التوجيه.",
      improvement: "",
    };
  }
}

export type CodeGenerationResponse = {
  html: string;
  css: string;
  js: string;
  description: string;
  error?: string;
};

export async function generateCode(
  prompt: string,
): Promise<CodeGenerationResponse> {
  try {
    const response = await apiRequest("POST", "/api/ai/generate-code", {
      prompt,
    });
    return await response.json();
  } catch (error) {
    console.error("Error generating code:", error);
    return {
      html: "",
      css: "",
      js: "",
      description:
        "An error occurred while generating the code. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function generateProjectIdea(
  interests: string,
  goal: string,
  tools: string,
): Promise<ProjectIdeaResponse> {
  try {
    const response = await apiRequest("POST", "/api/ai/project-idea", {
      interests,
      goal,
      tools,
    });
    return await response.json();
  } catch (error) {
    console.error("Error generating project idea:", error);
    return {
      title: "حدث خطأ في توليد فكرة المشروع",
      description: "يرجى المحاولة مرة أخرى لاحقًا.",
      steps: [],
      tools: [],
      difficulty: "beginner",
    };
  }
}

// New HTML generation with chat history
export type HTMLMessage = {
  role: "user" | "assistant";
  content: string;
  className?: string; // Optional class name for styling specific messages
};

export type GenerateHTMLResponse = {
  html: string;
  message: HTMLMessage;
  error?: string;
  isGeneratingHTML?: boolean; // Flag to indicate if we're generating HTML (close chat) or asking questions (keep chat open)
};

export type ClarificationResponse = {
  question: string;
  error?: string;
};

export type SummaryResponse = {
  summary: string;
  error?: string;
};

/**
 * Ask a clarifying question about the HTML idea
 * Uses a separate assistant specialized for clarification
 */
export async function getClarifyingQuestion(
  idea: string,
): Promise<ClarificationResponse> {
  try {
    // Create a message history with a user message first
    const messageHistory = [
      {
        role: "user" as const,
        content: `أنا أبي أبني: ${idea}`,
      },
    ];

    // Make the prompt more conversational and specifically ask the AI to use Saudi dialect
    const prompt = `أنا طالب وأبي أبني ${idea} باستخدام HTML. اسألني سؤال واحد يساعدني أوضح فكرتي بشكل أفضل. لازم تسألني بالعامية السعودية وبأسلوب ودي مثل "وش رأيك..."`;

    const response = await apiRequest("POST", "/api/ai/text/try-ai-assistant", {
      prompt,
      messageHistory,
      // Use the clarification assistant ID
      assistantId: "asst_x31y8qYnTlwvs1gAxKCNG5KB",
    });
    const data = await response.json();

    return {
      question: data.text,
      error: data.error,
    };
  } catch (error) {
    console.error("Error getting clarifying question:", error);
    return {
      question:
        "وش رأيك نضيف شوية تفاصيل أكثر عن المشروع؟ ممكن تعطيني أمثلة عن المحتوى اللي تبي تعرضه؟", // Fallback question in Saudi dialect
      error:
        error instanceof Error
          ? error.message
          : "Failed to get clarifying question",
    };
  }
}

/**
 * Generate a summary of the HTML project based on the original idea and clarification
 */
export async function getProjectSummary(
  idea: string,
  clarification: string,
): Promise<SummaryResponse> {
  try {
    // Create a message history for context
    const messageHistory = [
      {
        role: "user" as const,
        content: `أنا أبي أبني: ${idea}`,
      },
      {
        role: "assistant" as const,
        content:
          "سؤال للتوضيح: " + clarification.split(":").pop()?.trim() ||
          clarification, // Extract just the question part if possible
      },
      {
        role: "user" as const,
        content: clarification,
      },
    ];

    // Make the prompt more conversational in Saudi dialect - ask for summary followed by confirmation
    const prompt = `بناءً على فكرة الطالب وإجابته، قدم ملخصًا موجزًا بما ستقوم ببنائه (3-4 جمل كحد أقصى)، ثم أضف سطرًا فارغًا متبوعًا بـ "تبي نبدأ؟". من المهم أن تبدأ بملخص واضح ثم تنتهي بسؤال "تبي نبدأ؟".`;

    const response = await apiRequest("POST", "/api/ai/text/try-ai-assistant", {
      prompt,
      messageHistory,
      // Use the same clarification assistant ID
      assistantId: "asst_x31y8qYnTlwvs1gAxKCNG5KB",
    });
    const data = await response.json();

    return {
      summary: data.text,
      error: data.error,
    };
  } catch (error) {
    console.error("Error getting project summary:", error);
    return {
      summary: `إذن، تبي تبني ${idea}. يلا نبدأ!`,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get project summary",
    };
  }
}

export async function getFullProjectSummary(
  idea: string,
  clarification: string,
): Promise<SummaryResponse> {
  try {
    // Create a message history for context
    const messageHistory = [
      {
        role: "user" as const,
        content: `أنا أبي أبني: ${idea}`,
      },
      {
        role: "assistant" as const,
        content:
          "سؤال للتوضيح: " + clarification.split(":").pop()?.trim() ||
          clarification, // Extract just the question part if possible
      },
      {
        role: "user" as const,
        content: clarification,
      },
    ];

    // Make the prompt more conversational in Saudi dialect
    const prompt = `بناءً على فكرة الطالب وإجابته، قم بتلخيص الفكرة بشكل موجز وواضح، ثم اترك سطر فارغ واكتب "تبي نبدأ؟"`;

    const response = await apiRequest("POST", "/api/ai/text/try-ai-assistant", {
      prompt,
      messageHistory,
      // Use the same clarification assistant ID
      assistantId: "asst_x31y8qYnTlwvs1gAxKCNG5KB",
    });
    const data = await response.json();

    return {
      summary: data.text,
      error: data.error,
    };
  } catch (error) {
    console.error("Error getting project summary:", error);
    return {
      summary: `إذن، تبي تبني ${idea}. يلا نبدأ!`,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get project summary",
    };
  }
}

export async function generateHTML(
  messageHistory: HTMLMessage[],
): Promise<GenerateHTMLResponse> {
  try {
    // Filter out any loading messages to keep the context clean
    const filteredMessages = messageHistory.filter(
      (msg) => msg.className !== "loading-animation",
    );

    // Use the new Assistant API endpoint for better context preservation and clarification handling
    const response = await apiRequest("POST", "/api/assistant/generate-html", {
      messageHistory: filteredMessages,
    });
    return await response.json();
  } catch (error) {
    console.error("Error generating HTML:", error);

    // Try falling back to the original endpoint if the assistant API fails
    try {
      // Get filtered messages same as above
      const filtered = messageHistory.filter(
        (msg) => msg.className !== "loading-animation",
      );
      console.log("Assistant API failed, falling back to standard endpoint");
      const fallbackResponse = await apiRequest(
        "POST",
        "/api/ai/generate-html",
        { messageHistory: filtered },
      );
      return await fallbackResponse.json();
    } catch (fallbackError) {
      console.error("Both HTML generation endpoints failed:", fallbackError);
      return {
        html: "",
        message: {
          role: "assistant",
          content:
            "أوه، صار فيه مشكلة. ممكن تحاول مرة ثانية وتعطيني وصف أوضح لموقعك؟",
        },
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
