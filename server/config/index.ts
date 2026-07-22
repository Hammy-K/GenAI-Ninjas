/**
 * Centralized Configuration Module
 *
 * Single source of truth for all application configuration including:
 * - Database credentials
 * - API keys and secrets
 * - AI model names and parameters
 * - Feature flags and timeouts
 * - Third-party service configuration
 */

// Utility function to require environment variables
function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || "";
}

// Utility function for optional environment variables
function optionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Main configuration object
 */
export const CONFIG = {
  // Environment
  environment: {
    NODE_ENV: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
  },

  // Database
  database: {
    url: requireEnv("DATABASE_URL"),
  },

  // Authentication
  auth: {
    jwtSecret: requireEnv("JWT_SECRET"),
    sessionSecret: optionalEnv("SESSION_SECRET", "default-session-secret"),
  },

  // AI Providers
  ai: {
    anthropic: {
      apiKey: optionalEnv("ANTHROPIC_API_KEY"),
      models: {
        CLAUDE_HAIKU_3_5: "claude-3-5-haiku-20250606",
        CLAUDE_SONNET_3_5: "claude-3-5-sonnet-20250606",
        CLAUDE_SONNET_3_7: "claude-3-7-sonnet-20250219",
        CLAUDE_SONNET_4: "claude-sonnet-4-20250514",
        CLAUDE_SONNET_4_5: "claude-sonnet-4-5-20250929",
      },
      config: {
        temperature: 0.1,
        maxTokens: 16000,
      },
      fallbackOrder: [
        "claude-sonnet-4-5-20250929",
        "claude-sonnet-4-20250514",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20250606",
        "claude-3-5-haiku-20250606",
      ],
    },
    openai: {
      apiKey: optionalEnv("OPENAI_API_KEY"),
      models: {
        GPT_4O: "gpt-4o",
        GPT_4O_MINI: "gpt-4o-mini",
        GPT_4_MINI: "gpt-4-mini",
        GPT_4_1_MINI: "gpt-4.1-mini",
        WHISPER_1: "whisper-1",
        TTS_1: "tts-1",
        TTS_1_HD: "tts-1-hd",
      },
      config: {
        temperature: 0.1,
        maxTokens: 4000,
      },
    },
  },

  // Token limits per feature/endpoint
  tokens: {
    DEFAULT_MAX_TOKENS: 4000,
    HTML_GENERATION_MAX_TOKENS: 4000,
    IMAGE_DESCRIPTION_MAX_TOKENS: 300,
    TEXT_GENERATION_MAX_TOKENS: 2000,
    ANALYSIS_MAX_TOKENS: 2000,
    GENERAL_CONVERSATION_MAX_TOKENS: 1000,
  },

  // Timeout and retry settings
  timeouts: {
    RETRY_SLEEP_MS: 1000,
    DEFAULT_TIMEOUT_MS: 30000,
  },

  // Firebase
  firebase: {
    projectId: optionalEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: optionalEnv(
      "VITE_FIREBASE_STORAGE_BUCKET",
      optionalEnv("VITE_FIREBASE_PROJECT_ID")
        ? `${optionalEnv("VITE_FIREBASE_PROJECT_ID")}.appspot.com`
        : undefined
    ),
    serviceAccountJson: optionalEnv("FIREBASE_SERVICE_ACCOUNT_JSON"),
  },

  // Google Services
  google: {
    driveServiceAccountJson: optionalEnv("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON"),
  },

  // Security & Encryption
  security: {
    encryptionKey: optionalEnv("ENCRYPTION_KEY"),
    cryptoSealSecret: optionalEnv("CRYPTO_SEAL_SECRET"),
  },

  // Feature-specific passwords (for admin endpoints)
  passwords: {
    aiPoll: optionalEnv("AI_POLL_PASSWORD"),
    textLibrary: optionalEnv("TEXT_LIBRARY_ADMIN_PASSWORD"),
    videoLibrary: optionalEnv("VIDEO_LIBRARY_ADMIN_PASSWORD"),
  },

  // Assistant IDs
  assistants: {
    htmlGenerator: "asst_8KzUOWHXMVpF1okBkE3AmnVq",
    tryaiStage: "asst_x31y8qYnTlwvs1gAxKCNG5KB",
    lovableMission: "asst_L23zNIrbAjmHwouCGGqRr1fA",
  },
} as const;

/**
 * Validate required configuration on startup
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Check required env vars
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is not set");
  }
  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is not set");
  }
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    errors.push(
      "At least one of OPENAI_API_KEY or ANTHROPIC_API_KEY must be set"
    );
  }

  if (errors.length > 0) {
    console.error("Configuration validation errors:");
    errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error(`Configuration validation failed: ${errors.join(", ")}`);
  }

  console.log("✅ Configuration validation passed");
}

export default CONFIG;
