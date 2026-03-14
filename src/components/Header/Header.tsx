import { component$ } from "@builder.io/qwik";

export const Header = component$(() => {
  return (
    <header class="h-16 bg-brand-light border-b border-brand-border px-6 flex items-center justify-between shadow-sm z-10 relative">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
          <img src="/favicon.svg" alt="OpenFamilyTree Logo" class="w-6 h-6" />
          OpenFamilyTree
        </h1>
        <span class="text-sm font-medium px-2 py-1 bg-amber-500 text-white rounded-md shadow-sm">Beta</span>
      </div>

      <div class="flex items-center space-x-3">
        <button class="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
          Save
        </button>
        <button class="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors shadow-sm">
          Sign In
        </button>
      </div>
    </header>
  );
});
