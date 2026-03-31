import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { FamilyTreeCanvas } from "../components/FamilyTreeCanvas";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-dark">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 relative">
          <FamilyTreeCanvas />
        </main>
      </div>
    </div>
  );
}
