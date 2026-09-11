"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLunch } from "@/lib/lunch-context";
import Icon from "./Icon";
import type { IconName } from "./Icon";
import LoadingScreen from "./LoadingScreen";
import InfoModal from "./modals/InfoModal";
import VisitedFormModal from "./modals/VisitedFormModal";
import VisitedNamePromptModal from "./modals/VisitedNamePromptModal";
import WishFormModal from "./modals/WishFormModal";
import PlacesModal from "./modals/PlacesModal";

const TABS: { route: string; label: string; icon: IconName }[] = [
  { route: "/rank", label: "Rank", icon: "trophy" },
  { route: "/explore", label: "Explore", icon: "search" },
  { route: "/map", label: "Map", icon: "pin" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { saveError, connError, setShowInfo, loading, firebaseConfigured } = useLunch();
  const pathname = usePathname();

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div className="max-w-md rounded-ticket border-[3px] border-ink bg-paper-50 p-8 shadow-stamp-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink bg-yolk text-ink">
            <Icon name="logo" size={26} />
          </div>
          <h1 className="font-display text-2xl tracking-wide text-ink">The Lunch Club needs setup</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Firebase isn&apos;t configured yet. Add your <code>NEXT_PUBLIC_FIREBASE_*</code> env vars
            (see the README) to <code>.env.local</code> and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingScreen />;

  const isActive = (route: string) => pathname === route || (route === "/rank" && pathname === "/");

  return (
    <div className="min-h-screen bg-paper pb-28 text-ink sm:pb-16">
      <div className="mx-auto max-w-[980px] px-5">
        <header className="relative overflow-hidden border-b-[3px] border-ink pb-8 pt-10 text-center">
          <div
            aria-hidden="true"
            className="lr-sunburst pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-60"
          />
          <div className="relative">
            <h1 className="m-0 flex items-center justify-center gap-3">
              <span className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-chili text-paper-50 shadow-stamp-sm">
                <Icon name="logo" size={26} />
              </span>
              <span className="flex flex-col items-center">
                <span className="font-display text-[1.5rem] leading-[0.95] tracking-wide text-ink sm:text-[2.1rem]">THE LUNCH</span>
                <span className="font-display text-[2.7rem] leading-[0.95] tracking-wide text-chili sm:text-[3.8rem]">CLUB</span>
              </span>
              <button
                type="button"
                title="How The Lunch Club works"
                aria-label="How The Lunch Club works"
                onClick={() => setShowInfo(true)}
                className="lr-focus ml-0.5 inline-flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center self-center rounded-full border-2 border-ink bg-paper-50 font-display text-[0.75rem] text-ink transition-transform hover:-translate-y-0.5"
              >
                i
              </button>
            </h1>
            <div className="mt-3 inline-block -rotate-1 rounded-full border-2 border-ink bg-yolk px-4 py-1 font-display text-[0.72rem] tracking-[0.08em] text-ink">
              NEVER MORE THAN A 20-MIN WALK
            </div>
          </div>
        </header>

        {/* Desktop / tablet nav — ticket tabs */}
        <nav className="mb-8 mt-6 hidden items-center justify-center gap-3 sm:flex" aria-label="Sections">
          {TABS.map((t) => {
            const active = isActive(t.route);
            return (
              <Link
                key={t.route}
                href={t.route}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink px-5 py-2.5 font-display text-[0.88rem] tracking-wide transition-transform hover:-translate-y-0.5 ${
                  active ? "bg-chili text-paper-50 shadow-stamp-sm" : "bg-paper-50 text-ink shadow-stamp-sm hover:bg-yolk-100"
                }`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="sm:hidden" style={{ height: "1.5rem" }} />

        {connError && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border-[2.5px] border-chili-600 bg-chili-50 px-4 py-3 text-center font-display text-[0.78rem] tracking-wide text-chili-700 shadow-stamp-chili">
            <span aria-hidden="true">⚠</span>
            Couldn&apos;t connect to Firestore — check your Firebase config and that the project exists.
          </div>
        )}

        {children}

        {saveError && (
          <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl border-[2.5px] border-chili-600 bg-chili-50 px-4 py-3 text-center font-display text-[0.78rem] tracking-wide text-chili-700 shadow-stamp-chili">
            <span aria-hidden="true">⚠</span>
            Couldn&apos;t save that change — check your connection and try again.
          </div>
        )}
        <div className="mt-10 text-center font-display text-[0.7rem] tracking-wide text-ink-faint">
          SHARED LIST — ANYONE WITH THIS LINK CAN ADD SPOTS, RANK THEM, AND EDIT ENTRIES
        </div>
      </div>

      {/* Mobile bottom tab bar — thumb-reachable, safe-area aware */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-paper-50 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Sections"
      >
        <div className="flex items-stretch justify-around">
          {TABS.map((t) => {
            const active = isActive(t.route);
            return (
              <Link
                key={t.route}
                href={t.route}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    active ? "border-ink bg-chili text-paper-50" : "border-transparent text-ink-faint"
                  }`}
                >
                  <Icon name={t.icon} size={17} />
                </span>
                <span className={`font-display text-[0.62rem] tracking-wide ${active ? "text-ink" : "text-ink-faint"}`}>
                  {t.label.toUpperCase()}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <InfoModal />
      <VisitedFormModal />
      <VisitedNamePromptModal />
      <WishFormModal />
      <PlacesModal />
    </div>
  );
}
