export type TextDirection = "ltr" | "rtl" | "auto";

const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LATIN_SCRIPT_REGEX = /[A-Za-z]/;

export function detectTextDirection(text: string): "ltr" | "rtl" {
  for (const char of text) {
    if (ARABIC_SCRIPT_REGEX.test(char)) {
      return "rtl";
    }
    if (LATIN_SCRIPT_REGEX.test(char)) {
      return "ltr";
    }
  }
  return "ltr";
}

export function resolveElementDirection(
  configuredDirection: TextDirection,
  sampleText?: string
): "ltr" | "rtl" | "auto" {
  if (configuredDirection === "ltr" || configuredDirection === "rtl") {
    return configuredDirection;
  }
  if (sampleText && sampleText.trim().length > 0) {
    return detectTextDirection(sampleText);
  }
  return "auto";
}
