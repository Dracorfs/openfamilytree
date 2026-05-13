import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { FamilyTreeCanvas } from "../components/FamilyTreeCanvas";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = (matches: boolean) => {
      setIsMobile(matches);
      setSidebarOpen(!matches);
      setMenuOpen(false);
    };
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-dark dark:bg-gray-950">
      <Header
        menuOpen={menuOpen}
        sidebarOpen={sidebarOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onCloseMenu={() => setMenuOpen(false)}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar open={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 relative">
          <FamilyTreeCanvas />
        </main>
      </div>
    </div>
  );
}
