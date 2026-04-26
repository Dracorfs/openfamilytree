import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import {
  type Lang,
  type TranslationKey,
  SUPPORTED_LANGS,
  translations,
  interpolate,
} from "../i18n/translations";

type TFunc = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: TFunc;
}>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (k) => k,
});

export function useTranslation() {
  return useContext(LanguageContext);
}

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("lang");
  if (stored && (SUPPORTED_LANGS as string[]).includes(stored)) return stored as Lang;
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  if (nav === "es") return "es";
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(
    () => setLangState((l) => (l === "en" ? "es" : "en")),
    [],
  );

  const t: TFunc = useCallback(
    (key, vars) => interpolate(translations[lang][key] ?? translations.en[key] ?? key, vars),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
