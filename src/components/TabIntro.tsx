export default function TabIntro({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-7">
      <h2 className="m-0 font-display text-[2rem] leading-[1.05] tracking-wide text-ink sm:text-4xl">{title}</h2>
      <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-ink-soft">{sub}</p>
    </div>
  );
}
