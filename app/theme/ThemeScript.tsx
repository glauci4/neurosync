import { DEFAULT_THEME_PREFERENCE, THEME_STORAGE_KEY } from "./theme.types";

const themeScript = `
(function() {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var preference = localStorage.getItem(key) || ${JSON.stringify(DEFAULT_THEME_PREFERENCE)};
    if (preference !== 'claro' && preference !== 'escuro' && preference !== 'automatico') {
      preference = ${JSON.stringify(DEFAULT_THEME_PREFERENCE)};
    }
    var resolved = preference === 'automatico'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro')
      : preference;
    document.documentElement.classList.toggle('dark', resolved === 'escuro');
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
  } catch (error) {}
})();
`;

export default function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: script inline mínimo para aplicar a classe de tema antes da hidratação e reduzir flicker.
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}

