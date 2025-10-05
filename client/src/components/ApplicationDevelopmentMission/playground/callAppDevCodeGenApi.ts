import { parseAiResponse } from "@/components/AiHtmlGenerator/ai-html-api";
import { AiResponse, Message } from "@/components/AiHtmlGenerator/types";
import { MissionSlug } from "./config/types";

const GENAI_API_ENDPOINTS = {
  appDevCodeGenerator: "/api/genai/app-dev/code-generator",
  appDevFrontend: "/api/app-dev/frontend",
};

export const callAppDevCodeGenApi = async (
  userMessage: string,
  messageHistory: Message[],
  studentId: string,
  systemPrompt: string,
): Promise<AiResponse> => {
  try {
    const response = await fetch(GENAI_API_ENDPOINTS.appDevCodeGenerator, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        history: messageHistory.map(({ role, content }) => ({ role, content })),
        userId: studentId,
        systemPrompt,
      }),
    });

    const data = await response.json();

    return parseAiResponse(data);
  } catch (error) {
    console.error("Failed to call AppDev CodeGen API:", error);
    return {
      role: "assistant",
      aiMessage:
        "أوه! شكلي متوهّق من كثر الطلبات 😵‍💫 عطيني كم ثانية وارجع جرّب !",
      htmlContent: undefined,
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
};

export interface SaveAppDevProjectParams {
  htmlContent: string;
  studentId: string;
  organization: string;
  mission: MissionSlug;
}

export interface AppDevFrontendRow {
  id: number;
  projectId: string | null;
  html: string;
  userId: string;
  organization: string | null;
  isFeatured: boolean;
  mission: MissionSlug;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number | null;
    fullName: string | null;
    schoolName: string | null;
    phoneNumber: string | null;
    createdAt: string | null;
  } | null;
}

export async function saveAppDevProject(
  params: SaveAppDevProjectParams,
): Promise<string | null> {
  const { htmlContent, studentId, organization, mission } = params;

  if (!htmlContent || !studentId || !organization || !mission) {
    throw new Error("Missing required parameters");
  }

  const payload = {
    html: htmlContent,
    userId: studentId,
    organization,
    mission,
  };

  const res = await fetch(GENAI_API_ENDPOINTS.appDevFrontend, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Save failed: ${res.status} ${res.statusText} ${text ? `- ${text}` : ""}`,
    );
  }

  const row = (await res.json()) as AppDevFrontendRow;

  const projectId = row.projectId;

  if (!projectId) {
    throw new Error("Project ID is missing from api response");
  }

  return projectId;
}
