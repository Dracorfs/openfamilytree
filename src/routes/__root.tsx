import { createRootRoute, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "../components/ThemeProvider";
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
});

const themeInitScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark";d.style.backgroundColor="#1a1a2e";}else{d.style.colorScheme="light";d.style.backgroundColor="#FEFDFC";}}catch(e){}})();`;

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
