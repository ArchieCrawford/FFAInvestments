import { useTheme } from "./ThemeProvider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-1 py-1 text-xs">
      <button
        onClick={() => setTheme("default")}
        className={`px-2 py-1 rounded-full ${
          theme === "default"
            ? "bg-primary text-white"
            : "text-muted"
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-2 py-1 rounded-full ${
          theme === "dark"
            ? "bg-primary text-white"
            : "text-muted"
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme("maroon")}
        className={`px-2 py-1 rounded-full ${
          theme === "maroon"
            ? "bg-primary text-white"
            : "text-muted"
        }`}
      >
        Maroon
      </button>
    </div>
  );
}
