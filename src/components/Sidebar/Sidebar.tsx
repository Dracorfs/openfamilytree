import { component$, useSignal } from "@builder.io/qwik";

export const Sidebar = component$(() => {
  const activeTab = useSignal("Personal");
  const tabs = ["Personal", "Partners", "Contact", "Biography"];

  return (
    <aside class="w-[360px] h-full bg-white border-r border-brand-border shadow-lg flex flex-col z-10 relative">
      {/* Sidebar Header (Person Info) */}
      <div class="p-6 border-b border-brand-border bg-slate-50/50">
        <div class="flex flex-col items-center">
          <div class="w-24 h-24 rounded-lg bg-slate-200 border border-slate-300 mb-4 shadow-sm flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-800 text-center">Me</h2>
          <p class="text-sm text-slate-500 mt-1">b. 1990</p>
        </div>

        {/* Action Buttons */}
        <div class="grid grid-cols-2 gap-2 mt-6">
          <button class="col-span-2 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            + Add Partner
          </button>
          <button class="py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            + Add Parent
          </button>
          <button class="py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            + Add Child
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div class="flex border-b border-brand-border bg-slate-100/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick$={() => (activeTab.value = tab)}
            class={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              activeTab.value === tab
                ? "bg-white text-brand-link border-b-2 border-brand-link"
                : "text-slate-600 hover:text-slate-900 border-b border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div class="flex-1 overflow-y-auto p-4 bg-white">
        {activeTab.value === "Personal" && (
          <div class="space-y-4">
            <div class="grid grid-cols-[100px_1fr] items-center gap-2">
              <label class="text-xs font-medium text-slate-600 text-right">Given names:</label>
              <input type="text" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" defaultValue="Me" />
            </div>
            <div class="grid grid-cols-[100px_1fr] items-center gap-2">
              <label class="text-xs font-medium text-slate-600 text-right">Surname:</label>
              <input type="text" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" />
            </div>
            <div class="grid grid-cols-[100px_1fr] items-center gap-2">
              <label class="text-xs font-medium text-slate-600 text-right">Birth surname:</label>
              <input type="text" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" />
            </div>
            
            <div class="grid grid-cols-[100px_1fr] items-center gap-2 mt-4">
              <label class="text-xs font-medium text-slate-600 text-right">Gender:</label>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="gender" value="f" class="accent-brand-link" /> Female
                </label>
                <label class="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="gender" value="m" class="accent-brand-link" defaultChecked /> Male
                </label>
              </div>
            </div>

            <div class="mt-4 border-t border-slate-100 pt-4 space-y-4">
              <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                <label class="text-xs font-medium text-slate-600 text-right">Born:</label>
                <input type="text" placeholder="Date" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" defaultValue="1990" />
              </div>
              <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                <label class="text-xs font-medium text-slate-600 text-right">in:</label>
                <input type="text" placeholder="Place" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" />
              </div>
            </div>

            <div class="mt-4 border-t border-slate-100 pt-4 space-y-4">
              <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                <label class="text-xs font-medium text-slate-600 text-right">Died:</label>
                <input type="text" placeholder="Date" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" />
              </div>
              <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                <label class="text-xs font-medium text-slate-600 text-right">in:</label>
                <input type="text" placeholder="Place" class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50" />
              </div>
            </div>
          </div>
        )}

        {activeTab.value === "Partners" && (
          <div class="text-sm text-slate-500 italic text-center mt-10">
            No partners added yet.
          </div>
        )}

        {activeTab.value === "Contact" && (
          <div class="space-y-4">
            <div class="grid grid-cols-[80px_1fr] items-center gap-2">
              <label class="text-xs font-medium text-slate-600 text-right">Email:</label>
              <input type="email" class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link" />
            </div>
            <div class="grid grid-cols-[80px_1fr] items-center gap-2">
              <label class="text-xs font-medium text-slate-600 text-right">Phone:</label>
              <input type="tel" class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link" />
            </div>
            <div class="grid grid-cols-[80px_1fr] items-start gap-2">
              <label class="text-xs font-medium text-slate-600 text-right pt-1">Address:</label>
              <textarea rows={3} class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link" />
            </div>
          </div>
        )}

        {activeTab.value === "Biography" && (
          <div class="flex flex-col h-full">
            <textarea 
              class="flex-1 w-full p-3 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link resize-none"
              placeholder="Write biography details here..."
            />
          </div>
        )}
      </div>
    </aside>
  );
});
