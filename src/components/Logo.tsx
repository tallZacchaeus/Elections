/** The PASA leaf mark used throughout the design. */
export function LeafMark({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path d="M23 7c5 6 5 12 0 18-5-6-5-12 0-18z" fill="#7FC79A" />
      <path d="M14 16c6 2 9 7 9 14-6-2-9-7-9-14z" fill="#C8932A" />
      <path d="M32 16c-6 2-9 7-9 14 6-2 9-7 9-14z" fill="#C8932A" />
      <circle cx="23" cy="33" r="3.4" fill="#F4F1E6" />
    </svg>
  );
}

/** Circular badge wrapping the leaf mark (dark green + gold ring). */
export function LogoBadge({
  size = 84,
  iconSize,
}: {
  size?: number;
  iconSize?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#0A3D26",
        border: "2px solid #C8932A",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 14px 40px rgba(0,0,0,.4)",
        flex: "none",
      }}
    >
      <LeafMark size={iconSize ?? Math.round(size * 0.55)} />
    </span>
  );
}
