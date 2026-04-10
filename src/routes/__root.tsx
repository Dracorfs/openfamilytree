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

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
