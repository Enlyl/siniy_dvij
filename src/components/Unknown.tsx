export function Unknown({ children = "неизвестно" }: { children?: string }) {
  return (
    <span className="unknown" title="Данных нет — значит, и придумывать не будем">
      🤷 {children}
    </span>
  );
}

export function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  const empty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  return (
    <div className={className}>
      <dt className="text-[0.6875rem] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-[0.9375rem] leading-snug">{empty ? <Unknown /> : value}</dd>
    </div>
  );
}
