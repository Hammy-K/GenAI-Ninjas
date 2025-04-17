/**
 * Input validation and filtering utility functions
 * These functions help validate user input across the application
 */

/**
 * Checks if input contains meaningless or inappropriate content
 * @param input The user input string to validate
 * @returns An object with the validation result and an error message if invalid
 */
export function validateInput(input: string): { isValid: boolean; errorMessage: string } {
  // Trim the input
  const trimmedInput = input.trim();
  
  // Check if input is empty
  if (!trimmedInput) {
    return {
      isValid: false,
      errorMessage: "الرجاء إدخال نص قبل الإرسال"
    };
  }
  
  // Check if input is too short
  if (trimmedInput.length < 2) {
    return {
      isValid: false,
      errorMessage: "الرجاء إدخال نص أطول"
    };
  }
  
  // Check for repeated characters that might indicate random input
  const repeatedCharsRegex = /(.)\1{4,}/; // 5 or more of the same character in a row
  if (repeatedCharsRegex.test(trimmedInput)) {
    return {
      isValid: false,
      errorMessage: "يبدو أن النص عشوائي، الرجاء إدخال محتوى مناسب"
    };
  }
  
  // Check for keyboard smashing patterns
  const keyboardSmashPatterns = [
    /asdf/i, /qwer/i, /zxcv/i, // English keyboard rows
    /1234/i, // Sequential numbers
  ];
  
  if (keyboardSmashPatterns.some(pattern => pattern.test(trimmedInput))) {
    return {
      isValid: false,
      errorMessage: "يبدو أن النص عشوائي، الرجاء إدخال محتوى مناسب"
    };
  }
  
  // Check for excessive special characters (potential gibberish)
  const specialCharsRatio = (trimmedInput.match(/[^\w\s\u0600-\u06FF]/g) || []).length / trimmedInput.length;
  if (specialCharsRatio > 0.3) { // If more than 30% of the input is special characters
    return {
      isValid: false,
      errorMessage: "يحتوي النص على الكثير من الرموز، الرجاء استخدام نص واضح"
    };
  }
  
  // Basic list of inappropriate words (Arabic and English)
  // This should be expanded based on the application's needs
  const inappropriateWords = [
    // English profanities
    "shit", "fuck", "bitch", "ass", "dick", "pussy", "cunt",
    // Arabic profanities (keep list small and focused)
    "كس", "طيز", "زب", "خرا", "منيك"
  ];
  
  // Check for inappropriate words
  const lowerCaseInput = trimmedInput.toLowerCase();
  for (const word of inappropriateWords) {
    if (lowerCaseInput.includes(word)) {
      return {
        isValid: false,
        errorMessage: "الرجاء استخدام لغة مناسبة والابتعاد عن الكلمات غير اللائقة"
      };
    }
  }
  
  // If all checks pass, input is valid
  return {
    isValid: true,
    errorMessage: ""
  };
}