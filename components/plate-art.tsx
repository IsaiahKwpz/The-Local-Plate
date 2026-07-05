// Simple hand-drawn top-down "plate" illustration, used as a placeholder in
// place of real dish photography (no image-generation tool is available).
// `variant` picks one of a few pre-made color/shape combinations so a list
// of cards doesn't all look identical - swap this for real uploaded photos
// (see lib/photos/queries.ts) once a restaurant/dish has any.

const VARIANTS = [
  { bg: "#F3E3DB", ring: "#E8D2C4", blobs: ["#B65A3A", "#667440", "#E8C87E"] },
  { bg: "#E9EEE6", ring: "#D8E2D3", blobs: ["#667440", "#E8C87E", "#B65A3A"] },
  { bg: "#F5EBD9", ring: "#EEE0BE", blobs: ["#E8C87E", "#B65A3A", "#667440"] },
];

export function PlateArt({ variant = 0 }: { variant?: number }) {
  const v = VARIANTS[variant % VARIANTS.length];

  return (
    <div
      className="flex aspect-[16/10] items-center justify-center rounded-sm"
      style={{ background: v.bg }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="h-[58%] w-[58%]">
        <circle cx="50" cy="50" r="42" fill="#fff" stroke={v.ring} strokeWidth="2" />
        <circle cx="50" cy="50" r="30" fill="none" stroke={v.ring} strokeWidth="1.5" />
        <ellipse cx="42" cy="46" rx="14" ry="10" fill={v.blobs[0]} />
        <ellipse cx="60" cy="54" rx="10" ry="8" fill={v.blobs[1]} />
        <ellipse cx="52" cy="60" rx="8" ry="6" fill={v.blobs[2]} />
      </svg>
    </div>
  );
}
