/**
 * Input validation and filtering utility functions
 * These functions help validate user input across the application
 */

/**
 * Checks if a prompt appears to be copied from the example prompt in the Prompt Analyzer stage
 * @param input The user input to check against the example prompt
 * @returns An object indicating if the prompt is valid and an error message if not
 */
export function validatePromptAnalyzerInput(input: string): {
  isValid: boolean;
  errorMessage: string;
} {
  try {
    // List of 5 flagged keywords from the example prompt
    const flaggedKeywords = [
      "Flappy", 
      "شخصية تقفز", 
      "تخطى عقبات", 
      "لعبة بسيطة", 
      "ألوان زاهية"
    ];
    
    // Count how many flagged keywords exist in the input
    const lowerCaseInput = input.toLowerCase();
    let matchCount = 0;
    
    for (const keyword of flaggedKeywords) {
      if (lowerCaseInput.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    // If 2 or more keywords match, consider it too similar to the example
    if (matchCount >= 2) {
      return {
        isValid: false,
        errorMessage: "جرب فكرة جديدة بأسلوبك الخاص — لا تنس أن الإبداع هو أهم مهارة هنا!"
      };
    }
    
    // Otherwise, the prompt is valid
    return {
      isValid: true,
      errorMessage: ""
    };
  } catch (error) {
    // Ensure we don't crash the app - fallback to allowing the prompt
    console.error("Error in validatePromptAnalyzerInput:", error);
    return {
      isValid: true,
      errorMessage: ""
    };
  }
}

/**
 * Checks if input contains meaningless or inappropriate content
 * @param input The user input string to validate
 * @returns An object with the validation result and an error message if invalid
 */
export function validateInput(input: string): {
  isValid: boolean;
  errorMessage: string;
} {
  // Trim the input
  const trimmedInput = input.trim();

  // Check if input is empty
  if (!trimmedInput) {
    return {
      isValid: false,
      errorMessage: "الرجاء إدخال نص قبل الإرسال",
    };
  }

  // Check if input is too short
  if (trimmedInput.length < 2) {
    return {
      isValid: false,
      errorMessage: "الرجاء إدخال نص أطول",
    };
  }

  // Check for repeated characters that might indicate random input
  const repeatedCharsRegex = /(.)\1{4,}/; // 5 or more of the same character in a row
  if (repeatedCharsRegex.test(trimmedInput)) {
    return {
      isValid: false,
      errorMessage: "يبدو أن النص عشوائي، الرجاء إدخال محتوى مناسب",
    };
  }

  // Check for keyboard smashing patterns
  const keyboardSmashPatterns = [
    /asdf/i,
    /qwer/i,
    /zxcv/i, // English keyboard rows
    /1234/i, // Sequential numbers
  ];

  if (keyboardSmashPatterns.some((pattern) => pattern.test(trimmedInput))) {
    return {
      isValid: false,
      errorMessage: "يبدو أن النص عشوائي، الرجاء إدخال محتوى مناسب",
    };
  }

  // Check for excessive special characters (potential gibberish)
  const specialCharsRatio =
    (trimmedInput.match(/[^\w\s\u0600-\u06FF]/g) || []).length /
    trimmedInput.length;
  if (specialCharsRatio > 0.3) {
    // If more than 30% of the input is special characters
    return {
      isValid: false,
      errorMessage: "يحتوي النص على الكثير من الرموز، الرجاء استخدام نص واضح",
    };
  }

  // Basic list of inappropriate words (Arabic and English)
  // This should be expanded based on the application's needs
  const inappropriateWords = [
    // English profanities & common variations
    "shit",
    "fuck",
    "fucking",
    "fucked",
    "f*ck",
    "bitch",
    "bastard",
    "asshole",
    "ass",
    "dick",
    "pussy",
    "cunt",
    "nigga",
    "nigger",
    "slut",
    "hoe",
    "whore",
    "retard",
    "faggot",
    "fag",
    "cock",
    "jerkoff",
    "jizz",
    "cum",
    "suck my dick",
    "suck",
    "dildo",
    "blowjob",
    "tits",
    "boobs",
    "a-hole",
    "balls",
    "porn",
    "nudes",

    // Arabic profanities (commonly known ones, without being overly aggressive)
    "كس",
    "كسمك",
    "طيز",
    "زب",
    "خرا",
    "منيك",
    "عرص",
    "شرموط",
    "متناك",
    "قحبة",
    "قواد",
    "غبي",
    "وسخ",
    "زق",
    "يلعن",
    "ابوك",
    "اختك",
    "امك",
    "قرف",
    "حيوان",

    // Mixed/romanized Arabic (common Latin spellings teens use)
    "kos",
    "kosk",
    "mkos",
    "mnayek",
    "3ars",
    "sharmoot",
    "sharmota",
    "za3b",
    "manayek",
    "kess",
    "khara",
    "fuck u",
    "fuck you",
    "go to hell",
    "screw you",
  ];

  // Check for inappropriate words
  const lowerCaseInput = trimmedInput.toLowerCase();
  for (const word of inappropriateWords) {
    if (lowerCaseInput.includes(word)) {
      return {
        isValid: false,
        errorMessage:
          "الرجاء استخدام لغة مناسبة والابتعاد عن الكلمات غير اللائقة",
      };
    }
  }

  // If all checks pass, input is valid
  return {
    isValid: true,
    errorMessage: "",
  };
}
