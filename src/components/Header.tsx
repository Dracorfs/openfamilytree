import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useTranslation } from "./LanguageProvider";

interface UserSession {
  name: string;
  email: string;
  image: string | null;
}

interface HeaderProps {
  menuOpen: boolean;
  sidebarOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleSidebar: () => void;
}

export function Header({ menuOpen, sidebarOpen, onToggleMenu, onCloseMenu, onToggleSidebar }: HeaderProps) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
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

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      setSaved(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setSaved(false), 2000);
    };
    document.addEventListener("save-family-tree-success", handler);
    return () => {
      document.removeEventListener("save-family-tree-success", handler);
      if (timeout) clearTimeout(timeout);
    };
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

  const menuTouchStartXRef = useRef<number | null>(null);
  const [menuDragOffset, setMenuDragOffset] = useState(0);
  const menuDragging = menuDragOffset !== 0;

  const handleMenuTouchStart = useCallback((e: React.TouchEvent) => {
    if (!menuOpen) return;
    menuTouchStartXRef.current = e.touches[0].clientX;
  }, [menuOpen]);

  const handleMenuTouchMove = useCallback((e: React.TouchEvent) => {
    if (menuTouchStartXRef.current == null) return;
    const dx = e.touches[0].clientX - menuTouchStartXRef.current;
    setMenuDragOffset(Math.max(0, dx));
  }, []);

  const handleMenuTouchEnd = useCallback(() => {
    if (menuTouchStartXRef.current == null) return;
    const shouldClose = menuDragOffset > 60;
    menuTouchStartXRef.current = null;
    setMenuDragOffset(0);
    if (shouldClose) onCloseMenu();
  }, [menuDragOffset, onCloseMenu]);

  const themeButton = (
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
  );

  const langButton = (
    <button
      onClick={toggleLang}
      aria-label={t("header.languageSwitch")}
      title={t("header.languageSwitch")}
      className="flex items-center gap-1 p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md transition-colors"
    >
      <span className="text-xs font-bold leading-none">{nextLangLabel}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <polygon points="12 4 6 10 18 10" />
        <polygon points="12 20 6 14 18 14" />
      </svg>
    </button>
  );

  const googleIcon = (
    <svg viewBox="0 0 24 24" width="16" height="16" className="flex-shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const saveIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );

  const checkIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const signOutIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const gearIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );

  const accountAvatar = (
    <div className="relative group w-8 h-8 ml-1 rounded-full overflow-hidden flex-shrink-0">
      {user ? (
        user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 flex items-center justify-center text-slate-400 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
      {user && (
        <button
          type="button"
          onClick={handleSignOut}
          aria-label={t("header.signOut")}
          title={t("header.signOut")}
          className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus:outline-none transition-opacity duration-150"
        >
          {signOutIcon}
        </button>
      )}
    </div>
  );

  const authPill = (
    <div className="flex items-center h-10 pl-1 pr-1 rounded-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 shadow-sm">
      {user ? (
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent("save-family-tree"))}
          disabled={saved}
          className={`flex items-center gap-2 pl-3 pr-3 h-8 rounded-full text-sm font-medium transition-colors duration-200 ${
            saved
              ? "bg-emerald-500 text-white cursor-default"
              : "text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
          }`}
        >
          <span key={saved ? "check" : "save"} className="inline-flex animate-[saveCheckPop_300ms_ease-out]">
            {saved ? checkIcon : saveIcon}
          </span>
          {t("header.save")}
        </button>
      ) : (
        <button
          onClick={handleSignIn}
          className="flex items-center gap-2 pl-3 pr-3 h-8 rounded-full text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        >
          {googleIcon}
          {t("header.signInToSave")}
        </button>
      )}
      {accountAvatar}
    </div>
  );

  const menuAvatarVisual = (
    <span className="block w-8 h-8 ml-1 rounded-full overflow-hidden flex-shrink-0">
      {user ? (
        user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
            width={32}
            height={32}
          />
        ) : (
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        )
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-400 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
      )}
    </span>
  );

  const menuPill = (
    <button
      type="button"
      onClick={onToggleMenu}
      aria-label={menuOpen ? t("header.closeMenu") : t("header.openMenu")}
      className="md:hidden flex items-center h-10 pl-1 pr-1 rounded-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 shadow-sm hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full text-slate-700 dark:text-gray-200">
        {gearIcon}
      </span>
      {menuAvatarVisual}
    </button>
  );

  const downloadButton = (
    <button
      onClick={() => document.dispatchEvent(new CustomEvent("download-family-tree-pdf"))}
      aria-label={t("header.downloadPdf")}
      title={t("header.downloadPdf")}
      className="flex items-center gap-1.5 h-10 px-4 text-sm font-medium rounded-full shadow-sm text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors !w-auto self-start"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      PDF
    </button>
  );

  const actionPill = (
    <div className="flex items-center h-10 px-1 rounded-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 shadow-sm">
      {user ? (
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent("save-family-tree"))}
          disabled={saved}
          className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-full text-sm font-medium transition-colors duration-200 ${
            saved
              ? "bg-emerald-500 text-white cursor-default"
              : "text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
          }`}
        >
          <span key={saved ? "check" : "save"} className="inline-flex animate-[saveCheckPop_300ms_ease-out]">
            {saved ? checkIcon : saveIcon}
          </span>
          {t("header.save")}
        </button>
      ) : (
        <button
          onClick={handleSignIn}
          className="flex-1 flex items-center justify-center gap-2 h-8 rounded-full text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        >
          {googleIcon}
          {t("header.signInToSave")}
        </button>
      )}
    </div>
  );

  const accountSignoutPill = user ? (
    <div className="flex items-center h-10 pl-1 pr-1 rounded-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 shadow-sm">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label={t("header.signOut")}
        title={t("header.signOut")}
        className="flex-1 flex items-center justify-center gap-2 h-8 ml-1 rounded-full text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
      >
        {signOutIcon}
        {t("header.signOut")}
      </button>
    </div>
  ) : null;

  const restButtons = (
    <>
      {downloadButton}
      {loading ? (
        <div className="h-10 w-44 bg-slate-200 dark:bg-gray-700 rounded-full animate-pulse" />
      ) : (
        authPill
      )}
    </>
  );

  const mobileRestButtons = (
    <>
      {downloadButton}
      {loading ? (
        <div className="h-10 w-full bg-slate-200 dark:bg-gray-700 rounded-full animate-pulse" />
      ) : (
        <>
          {actionPill}
          {accountSignoutPill}
        </>
      )}
    </>
  );

  return (
    <>
      <header className="h-16 bg-brand-light dark:bg-gray-900 border-b border-brand-border dark:border-gray-700 px-4 md:px-6 flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center space-x-3 md:space-x-4">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? t("header.closeSidebar") : t("header.openSidebar")}
            className="md:hidden p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-brand-text dark:text-gray-100 tracking-tight flex items-center gap-2">
            <img src="/favicon.svg" alt="OpenFamilyTree Logo" className="w-6 h-6" />
            OpenFamilyTree
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-3">
            {themeButton}
            {langButton}
          </div>
          <div className="flex items-center gap-3">
            {restButtons}
          </div>
        </div>

        {menuPill}
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onCloseMenu}
        />
        <aside
          onTouchStart={handleMenuTouchStart}
          onTouchMove={handleMenuTouchMove}
          onTouchEnd={handleMenuTouchEnd}
          onTouchCancel={handleMenuTouchEnd}
          style={menuDragging ? { transform: `translateX(${menuDragOffset}px)` } : undefined}
          className={`absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-brand-light dark:bg-gray-900 border-l border-brand-border dark:border-gray-700 shadow-xl transform ${menuDragging ? "" : "transition-transform duration-200"} ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-end px-4 h-16 border-b border-brand-border dark:border-gray-700">
            <button
              onClick={onCloseMenu}
              aria-label={t("header.closeMenu")}
              className="p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="p-4 flex flex-col items-stretch gap-3 [&>button]:w-full [&>div]:w-full">
            <div className="flex flex-row items-center gap-3 !w-auto">
              {themeButton}
              {langButton}
            </div>
            {mobileRestButtons}
          </div>
        </aside>
      </div>
    </>
  );
}
