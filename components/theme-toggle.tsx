"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  // Bridges server-rendered (theme-unaware) markup to client-only state
  // (localStorage/matchMedia) - there's no render-time equivalent since
  // neither API exists during SSR, so this one-time mount effect is the
  // correct escape hatch rather than something to hoist into render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
      setDark(stored === "dark");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Renders nothing until mounted - the theme this button controls is a
  // client-only concept (localStorage), so there's no correct server-rendered
  // label to show without risking a hydration mismatch.
  if (dark === null) return null;

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-rule-strong px-3 py-1 text-xs font-medium whitespace-nowrap"
    >
      {dark ? "Daytime tones" : "Evening tones"}
    </button>
  );
}
