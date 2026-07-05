// A small illustrated collage of plates for the homepage hero - no
// image-generation tool is available in this environment, so this is a
// hand-drawn SVG composition (same technique as PlateArt) rather than a
// photo. Swap for a real photo whenever one exists.

export function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute top-2 left-4 h-[62%] w-[62%] rotate-[-8deg] drop-shadow-md">
        <circle cx="50" cy="50" r="44" fill="#FFFDF7" stroke="#EEE0BE" strokeWidth="2" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="#F1E6CC" strokeWidth="1.5" />
        <ellipse cx="50" cy="45" rx="17" ry="12" fill="#E8C87E" />
        <ellipse cx="37" cy="58" rx="9" ry="7" fill="#B65A3A" />
        <ellipse cx="63" cy="60" rx="8" ry="6" fill="#667440" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute right-2 bottom-4 h-[58%] w-[58%] rotate-[10deg] drop-shadow-md">
        <circle cx="50" cy="50" r="44" fill="#FFFDF7" stroke="#E8D2C4" strokeWidth="2" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="#EEDCCF" strokeWidth="1.5" />
        <ellipse cx="42" cy="46" rx="15" ry="10" fill="#B65A3A" />
        <ellipse cx="60" cy="55" rx="10" ry="8" fill="#667440" />
        <ellipse cx="52" cy="62" rx="8" ry="6" fill="#E8C87E" />
      </svg>
    </div>
  );
}
