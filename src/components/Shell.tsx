"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLunch } from "@/lib/lunch-context";
import Icon from "./Icon";
import LoadingScreen from "./LoadingScreen";
import InfoModal from "./modals/InfoModal";
import VisitedFormModal from "./modals/VisitedFormModal";
import VisitedNamePromptModal from "./modals/VisitedNamePromptModal";
import WishFormModal from "./modals/WishFormModal";
import PlacesModal from "./modals/PlacesModal";

const TABS = [
  { route: "/rank", label: "Rank" },
  { route: "/explore", label: "Explore" },
  { route: "/map", label: "Map" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { saveError, connError, setShowInfo, loading, firebaseConfigured } = useLunch();
  const pathname = usePathname();

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div className="max-w-md rounded-3xl border-2 border-coral/20 bg-white p-8 shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-coral-50 text-coral">
            <Icon name="sun" size={22} />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">Lunch Radius needs setup</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Firebase isn&apos;t configured yet. Add your <code>NEXT_PUBLIC_FIREBASE_*</code> env vars
            (see the README) to <code>.env.local</code> and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-cream pb-16 text-ink">
      <div className="mx-auto max-w-[980px] px-5">
        <header className="border-b-2 border-ink/5 pb-7 pt-10 text-center">
          <h1 className="m-0 flex items-center justify-center gap-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-coral text-white sm:h-10 sm:w-10">
              <Icon name="sun" size={20} />
            </span>
            Lunch <span className="text-coral">Radius</span>
            <button
              type="button"
              title="How Lunch Radius works"
              aria-label="How Lunch Radius works"
              onClick={() => setShowInfo(true)}
              className="ml-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-ink/10 bg-white align-middle font-display text-[0.68rem] font-bold text-coral transition-colors hover:border-coral"
            >
              i
            </button>
          </h1>
          <div className="mt-3 font-display text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-ink-faint">
            Great lunch, never more than a 20-minute walk away
          </div>
        </header>

        <nav className="lr-scroll-x sticky top-0 z-20 -mx-5 mb-8 bg-cream/95 px-5 pt-3 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:backdrop-blur-none" aria-label="Sections">
          <div className="flex items-center justify-center gap-2">
            {TABS.map((t) => {
              const active = pathname === t.route || (t.route === "/rank" && pathname === "/");
              return (
                <Link
                  key={t.route}
                  href={t.route}
                  aria-current={active ? "page" : undefined}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-display text-[0.8rem] font-semibold transition-colors duration-150 ${
                    active ? "bg-coral text-white shadow-pop" : "text-ink-soft hover:bg-white hover:text-coral"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {connError && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-berry/25 bg-berry/5 px-4 py-3 text-center font-display text-[0.78rem] font-medium text-berry">
            <span aria-hidden="true">⚠</span>
            Couldn&apos;t connect to Firestore — check your Firebase config and that the project exists.
          </div>
        )}

        {children}

        {saveError && (
          <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl border-2 border-berry/25 bg-berry/5 px-4 py-3 text-center font-display text-[0.78rem] font-medium text-berry">
            <span aria-hidden="true">⚠</span>
            Couldn&apos;t save that change — check your connection and try again.
          </div>
        )}
        <div className="mt-10 text-center font-display text-[0.7rem] text-ink-faint">
          Shared list — anyone with this link can add spots, rank them, and edit entries.
        </div>
      </div>

      <InfoModal />
      <VisitedFormModal />
      <VisitedNamePromptModal />
      <WishFormModal />
      <PlacesModal />
    </div>
  );
}
