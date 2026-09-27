export function LegendPanel({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-hair bg-void/90 px-2.5 py-2 text-[11px] backdrop-blur-md">
      {items.map((i) => (
        <div key={i.label} className="my-0.5 flex items-center gap-1.5 text-txt-secondary">
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: i.color }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}
