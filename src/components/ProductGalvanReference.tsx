export function ProductGalvanReference({
  reference,
  compact = false,
}: {
  reference: string | null | undefined;
  compact?: boolean;
}) {
  if (!reference?.trim()) return null;

  return (
    <p
      className={
        compact
          ? "text-xs text-stone-500"
          : "text-sm text-stone-600"
      }
    >
      <span className="text-stone-400">Ref. Pdto Galvan:</span>{" "}
      <span className="font-medium text-stone-700">{reference}</span>
    </p>
  );
}
