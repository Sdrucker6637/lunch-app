import Icon from "./Icon";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper text-ink">
      <div className="relative flex h-20 w-20 animate-float items-center justify-center rounded-full border-[3px] border-ink bg-chili text-paper-50 shadow-stamp-lg">
        <Icon name="ticket" size={34} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="font-display text-lg tracking-wide text-ink">PRINTING TODAY&apos;S TICKET…</div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-chili" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-yolk" style={{ animationDelay: "120ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-pickle" style={{ animationDelay: "240ms" }} />
        </div>
      </div>
    </div>
  );
}
