import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export const Sidebar = component$(() => {
  const activeTab = useSignal("Personal");
  const tabs = ["Personal", "Partners", "Contact", "Biography"];

  // Selected person state
  const selectedId = useSignal<string | null>(null);
  const personName = useSignal("");
  const surname = useSignal("");
  const birthSurname = useSignal("");
  const gender = useSignal("o");
  const birthDate = useSignal("");
  const birthPlace = useSignal("");
  const deathDate = useSignal("");
  const deathPlace = useSignal("");
  const email = useSignal("");
  const phone = useSignal("");
  const address = useSignal("");
  const biography = useSignal("");

  // Listen for node-selected events from the canvas
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) {
        selectedId.value = null;
        personName.value = "";
        surname.value = "";
        birthSurname.value = "";
        gender.value = "o";
        birthDate.value = "";
        birthPlace.value = "";
        deathDate.value = "";
        deathPlace.value = "";
        email.value = "";
        phone.value = "";
        address.value = "";
        biography.value = "";
        return;
      }
      selectedId.value = detail.id;
      personName.value = detail.name || "";
      surname.value = detail.surname || "";
      birthSurname.value = detail.birthSurname || "";
      gender.value = detail.gender || "o";
      birthDate.value = detail.birthYear || "";
      birthPlace.value = detail.birthPlace || "";
      deathDate.value = detail.deathDate || "";
      deathPlace.value = detail.deathPlace || "";
      email.value = detail.email || "";
      phone.value = detail.phone || "";
      address.value = detail.address || "";
      biography.value = detail.biography || "";
    };

    document.addEventListener("node-selected", handler);
    return () => document.removeEventListener("node-selected", handler);
  });

  // Dispatch update-node to canvas
  const dispatchUpdate = $((field: string, value: string) => {
    if (!selectedId.value) return;

    // For "name" field, also build the display name
    const data: Record<string, string> = { [field]: value };

    document.dispatchEvent(
      new CustomEvent("update-node", {
        detail: { nodeId: selectedId.value, data },
      })
    );
  });

  // Dispatch add-person to canvas
  const dispatchAdd = $((relation: "partner" | "parent" | "child") => {
    if (!selectedId.value) return;
    document.dispatchEvent(
      new CustomEvent("add-person", {
        detail: { relation, targetNodeId: selectedId.value },
      })
    );
  });

  const displayName = personName.value || "Select a person";
  const displayBirth = birthDate.value ? `b. ${birthDate.value}` : "";

  return (
    <aside class="w-[360px] h-full bg-white border-r border-brand-border shadow-lg flex flex-col z-10 relative">
      {/* Sidebar Header (Person Info) */}
      <div class="p-6 border-b border-brand-border bg-slate-50/50">
        <div class="flex flex-col items-center">
          <div
            class={[
              "w-24 h-24 rounded-lg border mb-4 shadow-sm flex items-center justify-center",
              selectedId.value
                ? gender.value === "f"
                  ? "bg-pink-50 border-pink-300 text-pink-400"
                  : gender.value === "m"
                  ? "bg-blue-50 border-blue-300 text-blue-400"
                  : "bg-slate-100 border-slate-300 text-slate-400"
                : "bg-slate-200 border-slate-300 text-slate-400",
            ].join(" ")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-800 text-center">{displayName}</h2>
          {displayBirth && <p class="text-sm text-slate-500 mt-1">{displayBirth}</p>}
        </div>

        {/* Action Buttons */}
        {selectedId.value && (
          <div class="grid grid-cols-2 gap-2 mt-6">
            <button
              onClick$={() => dispatchAdd("partner")}
              class="col-span-2 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              + Add Partner
            </button>
            <button
              onClick$={() => dispatchAdd("parent")}
              class="py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              + Add Parent
            </button>
            <button
              onClick$={() => dispatchAdd("child")}
              class="py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              + Add Child
            </button>
          </div>
        )}
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
        {!selectedId.value ? (
          <div class="text-sm text-slate-500 italic text-center mt-10">
            Click a person on the tree to edit their details.
          </div>
        ) : (
          <>
            {activeTab.value === "Personal" && (
              <div class="space-y-4">
                <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label class="text-xs font-medium text-slate-600 text-right">
                    Given names:
                  </label>
                  <input
                    type="text"
                    class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50"
                    value={personName.value}
                    onInput$={(e: InputEvent) => {
                      const val = (e.target as HTMLInputElement).value;
                      personName.value = val;
                      dispatchUpdate("name", val);
                    }}
                  />
                </div>
                <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label class="text-xs font-medium text-slate-600 text-right">
                    Surname:
                  </label>
                  <input
                    type="text"
                    class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50"
                    value={surname.value}
                    onInput$={(e: InputEvent) => {
                      const val = (e.target as HTMLInputElement).value;
                      surname.value = val;
                      dispatchUpdate("surname", val);
                    }}
                  />
                </div>
                <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label class="text-xs font-medium text-slate-600 text-right">
                    Birth surname:
                  </label>
                  <input
                    type="text"
                    class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50"
                    value={birthSurname.value}
                    onInput$={(e: InputEvent) => {
                      const val = (e.target as HTMLInputElement).value;
                      birthSurname.value = val;
                      dispatchUpdate("birthSurname", val);
                    }}
                  />
                </div>

                <div class="grid grid-cols-[100px_1fr] items-center gap-2 mt-4">
                  <label class="text-xs font-medium text-slate-600 text-right">
                    Gender:
                  </label>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="f"
                        checked={gender.value === "f"}
                        onChange$={() => {
                          gender.value = "f";
                          dispatchUpdate("gender", "f");
                        }}
                        class="accent-brand-link"
                      />{" "}
                      Female
                    </label>
                    <label class="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="m"
                        checked={gender.value === "m"}
                        onChange$={() => {
                          gender.value = "m";
                          dispatchUpdate("gender", "m");
                        }}
                        class="accent-brand-link"
                      />{" "}
                      Male
                    </label>
                    <label class="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="o"
                        checked={gender.value === "o"}
                        onChange$={() => {
                          gender.value = "o";
                          dispatchUpdate("gender", "o");
                        }}
                        class="accent-brand-link"
                      />{" "}
                      Other
                    </label>
                  </div>
                </div>

                <div class="mt-4 border-t border-slate-100 pt-4 space-y-4">
                  <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label class="text-xs font-medium text-slate-600 text-right">
                      Born:
                    </label>
                    <input
                      type="date"
                      class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50 text-slate-600"
                      value={birthDate.value}
                      onInput$={(e: InputEvent) => {
                        const val = (e.target as HTMLInputElement).value;
                        birthDate.value = val;
                        dispatchUpdate("birthYear", val);
                      }}
                    />
                  </div>
                  <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label class="text-xs font-medium text-slate-600 text-right">
                      in:
                    </label>
                    <input
                      type="text"
                      placeholder="Place"
                      class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50"
                      value={birthPlace.value}
                      onInput$={(e: InputEvent) => {
                        const val = (e.target as HTMLInputElement).value;
                        birthPlace.value = val;
                        dispatchUpdate("birthPlace", val);
                      }}
                    />
                  </div>
                </div>

                <div class="mt-4 border-t border-slate-100 pt-4 space-y-4">
                  <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label class="text-xs font-medium text-slate-600 text-right">
                      Died:
                    </label>
                    <input
                      type="date"
                      class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50 text-slate-600"
                      value={deathDate.value}
                      onInput$={(e: InputEvent) => {
                        const val = (e.target as HTMLInputElement).value;
                        deathDate.value = val;
                        dispatchUpdate("deathDate", val);
                      }}
                    />
                  </div>
                  <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label class="text-xs font-medium text-slate-600 text-right">
                      in:
                    </label>
                    <input
                      type="text"
                      placeholder="Place"
                      class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-link bg-slate-50"
                      value={deathPlace.value}
                      onInput$={(e: InputEvent) => {
                        const val = (e.target as HTMLInputElement).value;
                        deathPlace.value = val;
                        dispatchUpdate("deathPlace", val);
                      }}
                    />
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
                  <label class="text-xs font-medium text-slate-600 text-right">
                    Email:
                  </label>
                  <input
                    type="email"
                    class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link"
                    value={email.value}
                    onInput$={(e: InputEvent) => {
                      const val = (e.target as HTMLInputElement).value;
                      email.value = val;
                      dispatchUpdate("email", val);
                    }}
                  />
                </div>
                <div class="grid grid-cols-[80px_1fr] items-center gap-2">
                  <label class="text-xs font-medium text-slate-600 text-right">
                    Phone:
                  </label>
                  <input
                    type="tel"
                    class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link"
                    value={phone.value}
                    onInput$={(e: InputEvent) => {
                      const val = (e.target as HTMLInputElement).value;
                      phone.value = val;
                      dispatchUpdate("phone", val);
                    }}
                  />
                </div>
                <div class="grid grid-cols-[80px_1fr] items-start gap-2">
                  <label class="text-xs font-medium text-slate-600 text-right pt-1">
                    Address:
                  </label>
                  <textarea
                    rows={3}
                    class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link"
                    value={address.value}
                    onInput$={(e: InputEvent) => {
                      const val = (e.target as HTMLTextAreaElement).value;
                      address.value = val;
                      dispatchUpdate("address", val);
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab.value === "Biography" && (
              <div class="flex flex-col h-full">
                <textarea
                  class="flex-1 w-full p-3 text-sm border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-link resize-none"
                  placeholder="Write biography details here..."
                  value={biography.value}
                  onInput$={(e: InputEvent) => {
                    const val = (e.target as HTMLTextAreaElement).value;
                    biography.value = val;
                    dispatchUpdate("biography", val);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
});
