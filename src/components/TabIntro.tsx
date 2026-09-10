export default function TabIntro({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="m-0 font-display text-2xl font-extrabold text-ink">{title}</h2>
      <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{sub}</p>
    </div>
  );
}
