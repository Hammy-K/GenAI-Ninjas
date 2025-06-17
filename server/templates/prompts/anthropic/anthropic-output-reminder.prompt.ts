export const ANTHROPIC_OUTPUT_REMINDER_PROMPT = `
  Reminder: Please reply using only the following valid JSON format:
  {
    "aiMessage": "Your friendly, Saudi-style message to the student in Arabic",
    "htmlContent": "Complete HTML game code (only when generating/editing code, otherwise empty string)",
    "isHtmlGenerated": true/false (true only when htmlContent contains code),
    "isConversationComplete": true/false (true only when student explicitly says they're done)
  }
`.trim();
