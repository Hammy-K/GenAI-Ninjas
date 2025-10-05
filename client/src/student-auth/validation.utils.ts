export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** KSA mobile: must start with 05 and have 10 digits total */
export const isValidSaudiMobile = (phone: string) =>
  /^05\d{8}$/.test(phone.trim());

export const nonEmpty = (s: string) => s.trim().length > 0;
