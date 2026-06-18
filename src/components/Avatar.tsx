import { initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size: number;
  bg: string;
  photoUrl?: string | null;
  /** Font size for the initials fallback; defaults to ~35% of size. */
  fontSize?: number;
  /** Extra styles merged onto the avatar (e.g. margin, border). */
  style?: React.CSSProperties;
}

/**
 * Candidate avatar: shows the uploaded photo when available, otherwise a
 * coloured circle with the candidate's initials (the original design).
 */
export function Avatar({ name, size, bg, photoUrl, fontSize, style }: AvatarProps) {
  const common: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flex: "none",
    objectFit: "cover",
    ...style,
  };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ ...common, display: "block", background: bg }}
      />
    );
  }

  return (
    <div
      className="font-serif"
      aria-hidden="true"
      style={{
        ...common,
        background: bg,
        color: "#fff",
        fontSize: fontSize ?? Math.round(size * 0.35),
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initials(name)}
    </div>
  );
}
