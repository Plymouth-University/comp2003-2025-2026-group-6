
/* ===== Dark Mode ===== */
const themeButton = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.documentElement.setAttribute("data-theme", "dark");

  if (themeButton) {
    themeButton.textContent = "☀️ Light mode";
  }
}

if (themeButton) {
  themeButton.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      themeButton.textContent = "🌙 Dark mode";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      themeButton.textContent = "☀️ Light mode";
    }
  });
}

/* ===== Text Size Controls ===== */

const fontUp = document.getElementById("fontUp");
const fontDown = document.getElementById("fontDown");

let currentScale = parseFloat(localStorage.getItem("fontScale")) || 1;

document.documentElement.style.setProperty("--font-scale", currentScale);

if (fontUp) {
  fontUp.addEventListener("click", () => {
    currentScale = Math.min(1.5, currentScale + 0.1);
    document.documentElement.style.setProperty("--font-scale", currentScale);
    localStorage.setItem("fontScale", currentScale);
  });
}

if (fontDown) {
  fontDown.addEventListener("click", () => {
    currentScale = Math.max(0.8, currentScale - 0.1);
    document.documentElement.style.setProperty("--font-scale", currentScale);
    localStorage.setItem("fontScale", currentScale);
  });
}

/* ===== Accessibility Tonggle ===== */

const accessibilityToggle = document.getElementById("accessibilityToggle");
const accessibilityPanel = document.getElementById("accessibilityPanel");

if (accessibilityToggle && accessibilityPanel) {
  accessibilityToggle.addEventListener("click", () => {
    accessibilityPanel.hidden = !accessibilityPanel.hidden;
  });
}

/* High Contrast */

const contrastToggle = document.getElementById("contrastToggle");

const savedContrast = localStorage.getItem("contrastMode");

if (savedContrast === "high") {
  document.documentElement.setAttribute("data-contrast", "high");
  if (contrastToggle) contrastToggle.textContent = "High contrast: On";
}

if (contrastToggle) {
  contrastToggle.addEventListener("click", () => {
    const isHighContrast =
      document.documentElement.getAttribute("data-contrast") === "high";

    if (isHighContrast) {
      document.documentElement.removeAttribute("data-contrast");
      localStorage.setItem("contrastMode", "normal");
      contrastToggle.textContent = "High contrast";
    } else {
      document.documentElement.setAttribute("data-contrast", "high");
      localStorage.setItem("contrastMode", "high");
      contrastToggle.textContent = "High contrast: On";
    }
  });
}
