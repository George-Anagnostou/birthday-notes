/**
 * Theme configuration for elegant, recipient-specific color schemes
 *
 * Each recipient ID can be mapped to a sophisticated accent color
 * that provides visual identity while maintaining elegance
 */

export type AccentColor = {
  name: string;
  primary: string; // Main accent color
  light: string; // Light variant for backgrounds
  dark: string; // Dark variant for text/borders
  gradient: string; // Tailwind gradient classes
  hover: string; // Hover state color
};

/**
 * Elegant accent color palettes
 * Two playful yet sophisticated colors
 */
export const ACCENT_COLORS: Record<string, AccentColor> = {
  // Cookie Monster Blue - Bright, vibrant, and deep
  blue: {
    name: "Cookie Monster Blue",
    primary: "#1E88E5",
    light: "#E3F2FD",
    dark: "#0D47A1",
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    hover: "#1565C0",
  },

  // Elmo Red - Warm and vibrant
  red: {
    name: "Elmo Red",
    primary: "#DC143C",
    light: "#FFF0F0",
    dark: "#B71C1C",
    gradient: "from-red-500 via-red-600 to-red-700",
    hover: "#C41230",
  },
};

/**
 * Default accent color (used when recipient_id is not provided)
 */
export const DEFAULT_ACCENT: AccentColor = ACCENT_COLORS.blue;

/**
 * Get the accent color for a given recipient ID
 * Uses a hash function to deterministically pick a color based on the recipient ID
 * This ensures each recipient always gets the same color without hardcoding
 *
 * @param recipientId - The recipient's ID from RECIPIENT_ID env var
 * @returns AccentColor object with all color variants
 */
export function getAccentColor(recipientId: string | undefined): AccentColor {
  if (!recipientId) {
    return DEFAULT_ACCENT;
  }

  // Use a simple hash function to pick a color deterministically
  // Same recipient ID will always get the same color
  const colorKeys = Object.keys(ACCENT_COLORS);
  const hash = recipientId
    .toLowerCase()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % colorKeys.length;

  return ACCENT_COLORS[colorKeys[index]];
}

/**
 * Generate CSS custom properties for a given accent color
 * This allows dynamic theming throughout the app
 *
 * @param accent - AccentColor object
 * @returns CSS variables object
 */
export function getAccentCSSVars(accent: AccentColor) {
  return {
    "--accent-primary": accent.primary,
    "--accent-light": accent.light,
    "--accent-dark": accent.dark,
    "--accent-hover": accent.hover,
  } as React.CSSProperties;
}
