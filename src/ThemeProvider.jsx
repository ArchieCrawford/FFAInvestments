import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const themes = ["default", "dark", "maroon"];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored && themes.includes(stored)) return stored;
    return "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-maroon");
    if (theme === "dark") {
      root.classList.add("theme-dark");
    } else if (theme === "maroon") {
      root.classList.add("theme-maroon");
    }
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
