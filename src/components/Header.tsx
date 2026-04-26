import { useCallback, useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useTranslation } from "./LanguageProvider";

interface UserSession {
  name: string;
  email: string;
  image: string | null;
}

export function Header() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useTranslation();

  useEffect(() => {
    fetch("/api/auth/get-session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSignIn = useCallback(async () => {
    const { signIn } = await import("../lib/auth-client");
    await signIn.social({ provider: "google", callbackURL: "/" });
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.reload();
    } catch {}
  }, []);

  const nextLangLabel = lang === "en" ? "ES" : "EN";

  return (
    <header className="h-16 bg-brand-light dark:bg-gray-900 border-b border-brand-border dark:border-gray-700 px-6 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-brand-text dark:text-gray-100 tracking-tight flex items-center gap-2">
          <img src="/favicon.svg" alt="OpenFamilyTree Logo" className="w-6 h-6" />
          OpenFamilyTree
        </h1>
        <span className="text-sm font-medium px-2 py-1 bg-amber-500 text-white rounded-md shadow-sm">
          {t("header.beta")}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label={theme === "light" ? t("header.themeSwitchToDark") : t("header.themeSwitchToLight")}
        >
          {theme === "light" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleLang}
          aria-label={t("header.languageSwitch")}
          title={t("header.languageSwitch")}
          className="px-2 py-1 min-w-[36px] text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md transition-colors border border-slate-300 dark:border-gray-600"
        >
          {nextLangLabel}
        </button>

        <button
          onClick={() => user && document.dispatchEvent(new CustomEvent("save-family-tree"))}
          disabled={!user}
          title={!user ? t("header.signInTooltip") : undefined}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors shadow-sm ${
            user
              ? "text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer"
              : "text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 cursor-not-allowed"
          }`}
        >
          {t("header.save")}
        </button>

        {loading ? (
          <div className="w-24 h-8 bg-slate-200 dark:bg-gray-700 rounded-md animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-300 dark:border-gray-600 shadow-sm"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm shadow-sm">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300 hidden sm:inline">
                {user.name}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-colors shadow-sm"
            >
              {t("header.signOut")}
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" className="flex-shrink-0">
              <path
                fill="#fff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#fff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#fff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("header.signInGoogle")}
          </button>
        )}
      </div>
    </header>
  );
}
