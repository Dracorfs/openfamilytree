import { useCallback, useEffect, useState } from "react";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState("Personal");
  const tabs = ["Personal", "Relations", "Contact", "Biography"];

  type RelPerson = { id: string; name?: string; surname?: string; gender?: string };
  const [relations, setRelations] = useState<Record<string, RelPerson[]>>({});

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [people, setPeople] = useState<Array<{ id: string; name?: string; surname?: string; birthYear?: string; gender?: string }>>([]);
  const [personName, setPersonName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthSurname, setBirthSurname] = useState("");
  const [gender, setGender] = useState("o");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [deathPlace, setDeathPlace] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [biography, setBiography] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) {
        setSelectedId(null);
        setPersonName("");
        setSurname("");
        setBirthSurname("");
        setGender("o");
        setBirthDate("");
        setBirthPlace("");
        setDeathDate("");
        setDeathPlace("");
        setEmail("");
        setPhone("");
        setAddress("");
        setBiography("");
        setRelations({});
        return;
      }
      setSelectedId(detail.id);
      setRelations(detail.relations || {});
      setPersonName(detail.name || "");
      setSurname(detail.surname || "");
      setBirthSurname(detail.birthSurname || "");
      setGender(detail.gender || "o");
      setBirthDate(detail.birthYear || "");
      setBirthPlace(detail.birthPlace || "");
      setDeathDate(detail.deathDate || "");
      setDeathPlace(detail.deathPlace || "");
      setEmail(detail.email || "");
      setPhone(detail.phone || "");
      setAddress(detail.address || "");
      setBiography(detail.biography || "");
    };

    document.addEventListener("node-selected", handler);
    return () => document.removeEventListener("node-selected", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setPeople((e as CustomEvent).detail || []);
    };
    document.addEventListener("nodes-updated", handler);
    return () => document.removeEventListener("nodes-updated", handler);
  }, []);

  const selectPerson = useCallback((id: string) => {
    document.dispatchEvent(
      new CustomEvent("select-person-by-id", { detail: { id } }),
    );
  }, []);

  const dispatchUpdate = useCallback(
    (field: string, value: string) => {
      if (!selectedId) return;
      document.dispatchEvent(
        new CustomEvent("update-node", {
          detail: { nodeId: selectedId, data: { [field]: value } },
        }),
      );
    },
    [selectedId],
  );

  const dispatchAdd = useCallback(
    (relation: "partner" | "parent" | "child") => {
      if (!selectedId) return;
      document.dispatchEvent(
        new CustomEvent("add-person", {
          detail: { relation, targetNodeId: selectedId },
        }),
      );
    },
    [selectedId],
  );

  const displayName = personName || "Select a person";
  const displayBirth = birthDate ? `b. ${birthDate}` : "";

  return (
    <aside className="w-[360px] h-full bg-white dark:bg-gray-900 border-r border-brand-border dark:border-gray-700 shadow-lg flex flex-col z-10 relative">
      {/* Sidebar Header (Person Info) */}
      <div className="p-6 border-b border-brand-border dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
        <div className="flex flex-col items-center">
          {selectedId && (
            <div
              className={`w-24 h-24 rounded-lg border mb-4 shadow-sm flex items-center justify-center ${
                gender === "f"
                  ? "bg-pink-50 border-pink-300 text-pink-400"
                  : gender === "m"
                    ? "bg-blue-50 border-blue-300 text-blue-400"
                    : "bg-slate-100 border-slate-300 text-slate-400"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 text-center">{displayName}</h2>
          {displayBirth && <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{displayBirth}</p>}
        </div>

        {selectedId && (
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button
              onClick={() => dispatchAdd("partner")}
              className="py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              + Partner
            </button>
            <button
              onClick={() => dispatchAdd("parent")}
              className="py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              + Parents
            </button>
            <button
              onClick={() => dispatchAdd("child")}
              className="py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              + Child
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {selectedId && (
      <div className="flex border-b border-brand-border dark:border-gray-700 bg-slate-100/50 dark:bg-gray-800/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-gray-900 text-brand-link dark:text-blue-400 border-b-2 border-brand-link dark:border-blue-400"
                : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border-b border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        {!selectedId ? (
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide px-1">
              People ({people.length})
            </div>
            {people.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-gray-400 italic text-center mt-10">
                No people yet.
              </div>
            ) : (
              <ul className="space-y-1">
                {people.map((p) => {
                  const label = [p.name, p.surname].filter(Boolean).join(" ") || "Unnamed";
                  const dotClass =
                    p.gender === "f"
                      ? "bg-pink-300"
                      : p.gender === "m"
                        ? "bg-blue-300"
                        : "bg-slate-300";
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => selectPerson(p.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                        <span className="flex-1 truncate">{label}</span>
                        {p.birthYear && (
                          <span className="text-xs text-slate-400 dark:text-gray-500">
                            {p.birthYear}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <>
            {activeTab === "Personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Given names:</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200"
                    value={personName}
                    onChange={(e) => {
                      setPersonName(e.target.value);
                      dispatchUpdate("name", e.target.value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Surname:</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200"
                    value={surname}
                    onChange={(e) => {
                      setSurname(e.target.value);
                      dispatchUpdate("surname", e.target.value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Birth surname:</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200"
                    value={birthSurname}
                    onChange={(e) => {
                      setBirthSurname(e.target.value);
                      dispatchUpdate("birthSurname", e.target.value);
                    }}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-2 mt-4">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Gender:</label>
                  <div className="flex items-center gap-3">
                    {(["f", "m", "o"] as const).map((g) => (
                      <label key={g} className="flex items-center gap-1 text-sm text-slate-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={() => {
                            setGender(g);
                            dispatchUpdate("gender", g);
                          }}
                          className="accent-brand-link"
                        />
                        {g === "f" ? "Female" : g === "m" ? "Male" : "Other"}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-gray-700 pt-4 space-y-4">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Born:</label>
                    <input
                      type="date"
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200 text-slate-600"
                      value={birthDate}
                      onChange={(e) => {
                        setBirthDate(e.target.value);
                        dispatchUpdate("birthYear", e.target.value);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">in:</label>
                    <input
                      type="text"
                      placeholder="Place"
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200"
                      value={birthPlace}
                      onChange={(e) => {
                        setBirthPlace(e.target.value);
                        dispatchUpdate("birthPlace", e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-gray-700 pt-4 space-y-4">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Died:</label>
                    <input
                      type="date"
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200 text-slate-600"
                      value={deathDate}
                      onChange={(e) => {
                        setDeathDate(e.target.value);
                        dispatchUpdate("deathDate", e.target.value);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">in:</label>
                    <input
                      type="text"
                      placeholder="Place"
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 bg-slate-50 dark:bg-gray-800 dark:text-gray-200"
                      value={deathPlace}
                      onChange={(e) => {
                        setDeathPlace(e.target.value);
                        dispatchUpdate("deathPlace", e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Relations" && (() => {
              const sections = Object.entries(relations).filter(([, list]) => list.length > 0);
              if (sections.length === 0) {
                return (
                  <div className="text-sm text-slate-500 dark:text-gray-400 italic text-center mt-10">
                    No relations yet.
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {sections.map(([title, list]) => (
                    <div key={title}>
                      <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide px-1 mb-1">
                        {title}
                      </div>
                      <ul className="space-y-1">
                        {list.map((p) => {
                          const label = [p.name, p.surname].filter(Boolean).join(" ") || "Unnamed";
                          const dotClass =
                            p.gender === "f"
                              ? "bg-pink-300"
                              : p.gender === "m"
                                ? "bg-blue-300"
                                : "bg-slate-300";
                          return (
                            <li key={p.id}>
                              <button
                                onClick={() => selectPerson(p.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 transition-colors"
                              >
                                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                                <span className="flex-1 truncate">{label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              );
            })()}

            {activeTab === "Contact" && (
              <div className="space-y-4">
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Email:</label>
                  <input
                    type="email"
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      dispatchUpdate("email", e.target.value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">Phone:</label>
                  <input
                    type="tel"
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      dispatchUpdate("phone", e.target.value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-start gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right pt-1">Address:</label>
                  <textarea
                    rows={3}
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      dispatchUpdate("address", e.target.value);
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "Biography" && (
              <div className="flex flex-col h-full">
                <textarea
                  className="flex-1 w-full p-3 text-sm border border-slate-300 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 resize-none"
                  placeholder="Write biography details here..."
                  value={biography}
                  onChange={(e) => {
                    setBiography(e.target.value);
                    dispatchUpdate("biography", e.target.value);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
