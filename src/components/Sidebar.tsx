import { useCallback, useEffect, useState } from "react";
import { DatePickerField } from "./DatePickerField";
import { useTranslation } from "./LanguageProvider";
import { RELATION_KEY_TO_TRANSLATION, type TranslationKey } from "../i18n/translations";

type TabId = "personal" | "relations" | "contact" | "biography";
const TABS: { id: TabId; key: TranslationKey }[] = [
  { id: "personal", key: "sidebar.tab.personal" },
  { id: "relations", key: "sidebar.tab.relations" },
  { id: "contact", key: "sidebar.tab.contact" },
  { id: "biography", key: "sidebar.tab.biography" },
];

export function Sidebar() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("personal");

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
  const [biography, setBiography] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarEditing, setAvatarEditing] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);

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
        setBiography("");
        setAvatarUrl("");
        setAvatarEditing(false);
        setAvatarDraft("");
        setAvatarBroken(false);
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
      setBiography(detail.biography || "");
      setAvatarUrl(detail.avatarUrl || "");
      setAvatarDraft(detail.avatarUrl || "");
      setAvatarEditing(false);
      setAvatarBroken(false);
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

  const deletePerson = useCallback((id: string) => {
    document.dispatchEvent(
      new CustomEvent("delete-person", { detail: { id } }),
    );
  }, []);

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

  const displayName = personName || t("sidebar.selectPerson");
  const displayBirth = birthDate ? t("sidebar.bornShort", { date: birthDate }) : "";

  return (
    <aside className="w-[360px] h-full bg-white dark:bg-gray-900 border-r border-brand-border dark:border-gray-700 shadow-lg flex flex-col z-10 relative">
      {/* Sidebar Header (Person Info) */}
      <div className="relative p-6 border-b border-brand-border dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
        {selectedId && (
          <button
            onClick={() => deletePerson(selectedId)}
            aria-label={t("sidebar.deletePerson")}
            title={t("sidebar.deletePerson")}
            className="absolute top-2 right-2 p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        )}
        <div className="flex flex-col items-center">
          {selectedId && (
            <>
              <button
                type="button"
                onClick={() => {
                  setAvatarDraft(avatarUrl);
                  setAvatarEditing((v) => !v);
                }}
                aria-label={t("sidebar.editAvatar")}
                title={t("sidebar.editAvatar")}
                className={`group relative w-24 h-24 rounded-lg border mb-4 shadow-sm flex items-center justify-center overflow-hidden transition-all hover:shadow-md hover:ring-2 hover:ring-brand-link dark:hover:ring-blue-400 hover:ring-offset-2 dark:hover:ring-offset-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-link dark:focus-visible:ring-blue-400 ${
                  gender === "f"
                    ? "bg-pink-50 border-pink-300 text-pink-400"
                    : gender === "m"
                      ? "bg-blue-50 border-blue-300 text-blue-400"
                      : "bg-slate-100 border-slate-300 text-slate-400"
                }`}
              >
                {avatarUrl && !avatarBroken ? (
                  <img
                    src={avatarUrl}
                    alt={t("sidebar.avatarAlt")}
                    onError={() => setAvatarBroken(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
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
                )}
                <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-[10px] font-medium uppercase tracking-wide">
                    {t("sidebar.editAvatar")}
                  </span>
                </span>
              </button>
              {avatarEditing && (() => {
                const trimmedDraft = avatarDraft.trim();
                let avatarError: string | null = null;
                if (trimmedDraft) {
                  try {
                    const u = new URL(trimmedDraft);
                    if (u.protocol !== "http:" && u.protocol !== "https:") {
                      avatarError = t("sidebar.avatarErrorProtocol");
                    }
                  } catch {
                    avatarError = t("sidebar.avatarErrorInvalid");
                  }
                }
                const commit = () => {
                  if (avatarError) return;
                  setAvatarUrl(trimmedDraft);
                  setAvatarBroken(false);
                  dispatchUpdate("avatarUrl", trimmedDraft);
                  setAvatarEditing(false);
                };
                return (
                  <div className="w-full mb-4 flex flex-col gap-2">
                    <input
                      type="url"
                      autoFocus
                      placeholder={t("sidebar.avatarUrlPlaceholder")}
                      aria-invalid={avatarError ? true : undefined}
                      aria-describedby={avatarError ? "avatar-url-error" : undefined}
                      className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 bg-white dark:bg-gray-800 dark:text-gray-200 ${
                        avatarError
                          ? "border-red-400 dark:border-red-500 focus:ring-red-400 dark:focus:ring-red-500"
                          : "border-slate-300 dark:border-gray-600 focus:ring-brand-link dark:focus:ring-blue-400"
                      }`}
                      value={avatarDraft}
                      onChange={(e) => setAvatarDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commit();
                        } else if (e.key === "Escape") {
                          setAvatarEditing(false);
                          setAvatarDraft(avatarUrl);
                        }
                      }}
                    />
                    {avatarError && (
                      <p id="avatar-url-error" className="text-xs text-red-600 dark:text-red-400">
                        {avatarError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!!avatarError}
                        onClick={commit}
                        className="flex-1 py-1 text-xs font-medium bg-brand-link text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("sidebar.avatarSave")}
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl("");
                            setAvatarDraft("");
                            setAvatarBroken(false);
                            dispatchUpdate("avatarUrl", "");
                            setAvatarEditing(false);
                          }}
                          className="flex-1 py-1 text-xs font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {t("sidebar.avatarRemove")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
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
              {t("sidebar.addPartner")}
            </button>
            <button
              onClick={() => dispatchAdd("parent")}
              className="py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t("sidebar.addParents")}
            </button>
            <button
              onClick={() => dispatchAdd("child")}
              className="py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t("sidebar.addChild")}
            </button>
          </div>
        )}

      </div>

      {/* Tabs */}
      {selectedId && (
      <div className="flex border-b border-brand-border dark:border-gray-700 bg-slate-100/50 dark:bg-gray-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-brand-link dark:text-blue-400 border-b-2 border-brand-link dark:border-blue-400"
                : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border-b border-transparent"
            }`}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        {!selectedId ? (
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide px-1">
              {t("sidebar.peopleCount", { count: people.length })}
            </div>
            {people.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-gray-400 italic text-center mt-10">
                {t("sidebar.noPeople")}
              </div>
            ) : (
              <ul className="space-y-1">
                {people.map((p) => {
                  const label = [p.name, p.surname].filter(Boolean).join(" ") || t("sidebar.unnamed");
                  const dotClass =
                    p.gender === "f"
                      ? "bg-pink-300"
                      : p.gender === "m"
                        ? "bg-blue-300"
                        : "bg-slate-300";
                  return (
                    <li
                      key={p.id}
                      className="group flex items-center rounded hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <button
                        onClick={() => selectPerson(p.id)}
                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left text-slate-700 dark:text-gray-200"
                      >
                        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                        <span className="flex-1 truncate">{label}</span>
                        {p.birthYear && (
                          <span className="text-xs text-slate-400 dark:text-gray-500">
                            {p.birthYear}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePerson(p.id);
                        }}
                        aria-label={t("sidebar.deleteNamed", { name: label })}
                        className="mr-1 p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <>
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.givenNames")}</label>
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
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.surname")}</label>
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
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.birthSurname")}</label>
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
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.gender")}</label>
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
                        {g === "f" ? t("sidebar.gender.female") : g === "m" ? t("sidebar.gender.male") : t("sidebar.gender.other")}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-gray-700 pt-4 space-y-4">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.born")}</label>
                    <DatePickerField
                      value={birthDate}
                      ariaLabel={t("sidebar.bornDateAria")}
                      onChange={(v) => {
                        setBirthDate(v);
                        dispatchUpdate("birthYear", v);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.in")}</label>
                    <input
                      type="text"
                      placeholder={t("sidebar.placePlaceholder")}
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
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.died")}</label>
                    <DatePickerField
                      value={deathDate}
                      ariaLabel={t("sidebar.diedDateAria")}
                      onChange={(v) => {
                        setDeathDate(v);
                        dispatchUpdate("deathDate", v);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.in")}</label>
                    <input
                      type="text"
                      placeholder={t("sidebar.placePlaceholder")}
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

            {activeTab === "relations" && (() => {
              const sections = Object.entries(relations).filter(([, list]) => list.length > 0);
              if (sections.length === 0) {
                return (
                  <div className="text-sm text-slate-500 dark:text-gray-400 italic text-center mt-10">
                    {t("sidebar.noRelations")}
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {sections.map(([title, list]) => {
                    const titleKey = RELATION_KEY_TO_TRANSLATION[title];
                    const heading = titleKey ? t(titleKey) : title;
                    return (
                    <div key={title}>
                      <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide px-1 mb-1">
                        {heading}
                      </div>
                      <ul className="space-y-1">
                        {list.map((p) => {
                          const label = [p.name, p.surname].filter(Boolean).join(" ") || t("sidebar.unnamed");
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
                    );
                  })}
                </div>
              );
            })()}

            {activeTab === "contact" && (
              <div className="space-y-4">
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 text-right">{t("sidebar.email")}</label>
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
              </div>
            )}

            {activeTab === "biography" && (
              <div className="flex flex-col h-full">
                <textarea
                  className="flex-1 w-full p-3 text-sm border border-slate-300 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400 resize-none"
                  placeholder={t("biography.placeholder")}
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
