import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

interface UserSession {
  name: string;
  email: string;
  image: string | null;
}

export const Header = component$(() => {
  const user = useSignal<UserSession | null>(null);
  const loading = useSignal(true);

  // Fetch session on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          user.value = data.user;
        }
      }
    } catch {
      // Not signed in — that's ok
    } finally {
      loading.value = false;
    }
  });

  const handleSignIn = $(async () => {
    // Better Auth social sign-in requires POST — the client handles the redirect
    const { signIn } = await import("~/lib/auth-client");
    await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  });

  const handleSignOut = $(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      user.value = null;
      window.location.reload();
    } catch {
      // Silence errors
    }
  });

  return (
    <header class="h-16 bg-brand-light border-b border-brand-border px-6 flex items-center justify-between shadow-sm z-10 relative">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
          {/* eslint-disable-next-line qwik/jsx-img */}
          <img src="/favicon.svg" alt="OpenFamilyTree Logo" class="w-6 h-6" />
          OpenFamilyTree
        </h1>
        <span class="text-sm font-medium px-2 py-1 bg-amber-500 text-white rounded-md shadow-sm">Beta</span>
      </div>

      <div class="flex items-center space-x-3">
        <button 
          onClick$={() => document.dispatchEvent(new CustomEvent('save-family-tree'))}
          class="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
        >
          Save
        </button>

        {loading.value ? (
          <div class="w-24 h-8 bg-slate-200 rounded-md animate-pulse" />
        ) : user.value ? (
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              {user.value.image ? (
                // eslint-disable-next-line qwik/jsx-img
                <img
                  src={user.value.image}
                  alt={user.value.name}
                  class="w-8 h-8 rounded-full border border-slate-300 shadow-sm"
                  width={32}
                  height={32}
                />
              ) : (
                <div class="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-sm">
                  {user.value.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <span class="text-sm font-medium text-slate-700 hidden sm:inline">
                {user.value.name}
              </span>
            </div>
            <button
              onClick$={handleSignOut}
              class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick$={handleSignIn}
            class="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" class="flex-shrink-0">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
});
