import { createRootRoute, Link, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider, useTranslation } from "../components/LanguageProvider";
import "../global.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OpenFamilyTree" },
      { name: "description", content: "An open-source family tree builder" },
    ],
    links: [{ rel: "icon", href: "/favicon.svg" }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEFDFC] dark:bg-gray-950 text-slate-800 dark:text-gray-100 px-4">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg font-semibold mb-1">{t("notFound.title")}</p>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">{t("notFound.message")}</p>
      <Link
        to="/"
        className="px-4 py-2 rounded-md bg-brand-link text-white dark:bg-blue-500 hover:opacity-90 transition-opacity"
      >
        {t("notFound.home")}
      </Link>
    </div>
  );
}

const themeInitScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark";d.style.backgroundColor="#1a1a2e";}else{d.style.colorScheme="light";d.style.backgroundColor="#FEFDFC";}var l=localStorage.getItem("lang");if(l==="es"||l==="en"){d.lang=l;}else{var n=(navigator.language||"en").slice(0,2).toLowerCase();d.lang=n==="es"?"es":"en";}}catch(e){}})();`;

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider>
            <Outlet />
          </ThemeProvider>
        </LanguageProvider>
        <Scripts />
      </body>
    </html>
  );
}
