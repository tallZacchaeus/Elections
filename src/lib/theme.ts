// Shared brand constants used across server & client.

export const COLORS = {
  green900: "#06281a",
  green800: "#082e1d",
  green700: "#0a3d26",
  green600: "#0b4a2d",
  green500: "#0e5a37",
  green400: "#137a49",
  green300: "#1f6e5e",
  live: "#2da05a",
  mint: "#7fc79a",
  gold: "#c8932a",
  goldDeep: "#9a6b12",
  cream: "#f4f1e6",
  creamBg: "#eceae0",
  paper: "#f2f0e6",
  ink: "#16241c",
  inkSoft: "#46554c",
  inkMute: "#5c6b61",
  line: "#e4e0d4",
} as const;

// Avatar background palette used when seeding / adding candidates.
export const AVATAR_PALETTE = [
  "#0e5a37",
  "#9a6b12",
  "#1f6e5e",
  "#5c6b1e",
  "#137a49",
  "#0a3d26",
];

// Result bar palette (leading candidate is always gold).
export const BAR_PALETTE = [
  "#0e5a37",
  "#c8932a",
  "#1f6e5e",
  "#5c6b1e",
  "#137a49",
  "#0a3d26",
];

export function pickAvatarBg(seed: number): string {
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}
