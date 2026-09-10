import Icon from "./Icon";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream text-ink">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-coral text-white shadow-pop">
        <Icon name="sun" size={26} />
      </div>
      <div className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Finding today&apos;s lunch spots…
      </div>
    </div>
  );
}
