import type { Request, Response } from "express";
import {
  CopilotRuntime,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import { makeOpenAIAdapter } from "./copilot-kit.adapters";
import { COPILOT_ENDPOINT } from "./copilot-kit.config";

/**
 * Express handler for POST /copilotkit
 * Keep it stateless; create a fresh runtime per request.
 * If you later add actions/tools that are pure, you can hoist the runtime.
 */
export function createCopilotPostHandler() {
  const serviceAdapter = makeOpenAIAdapter();

  return async (req: Request, res: Response) => {
    const runtime = new CopilotRuntime();

    const handler = copilotRuntimeNodeHttpEndpoint({
      endpoint: COPILOT_ENDPOINT,
      runtime,
      serviceAdapter,
    });

    // Stream the response (CopilotKit writes directly to res)
    await handler(req as any, res as any);
  };
}

/**
 * Optional: simple health check for debugging
 */
// export function createCopilotHealthHandler() {
//   return (_req: Request, res: Response) => {
//     res.status(200).json({
//       ok: true,
//       endpoint: COPILOT_ENDPOINT,
//       model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
//       ts: new Date().toISOString(),
//     });
//   };
// }
