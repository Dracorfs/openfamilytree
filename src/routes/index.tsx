import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { QFamilyTreeCanvas } from "../integrations/react";

export default component$(() => {
  return (
    <div class="flex flex-col h-screen overflow-hidden bg-brand-dark">
      <Header />
      <div class="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main class="flex-1 relative">
          <QFamilyTreeCanvas />
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "OpenFamilyTree",
  meta: [
    {
      name: "description",
      content: "An open-source family tree builder",
    },
  ],
};
