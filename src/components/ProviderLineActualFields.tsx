"use client";

import {
  GALVAN_INTERNAL_ID_LABEL,
  HAM_WEIGHT_LABEL,
  formatLineOrderedSummary,
  getLineActualFields,
  getPiecesLabel,
  lineHasRequiredActuals,
  showGalvanInternalIdField,
  type LineActualDraft,
  type LineForActuals,
} from "@/lib/line-actuals";
import { ProductGalvanReference } from "@/components/ProductGalvanReference";

export interface LineDraft extends LineActualDraft {
  lineId: string;
  galvanInternalId: string;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine";

export function ProviderLineActualFields({
  line,
  draft,
  onUpdate,
}: {
  line: LineForActuals & { id: string; variant: LineForActuals["variant"] & { product: { name: string; galvanReference?: string }; presentation?: import("@prisma/client").VariantPresentation } };
  draft: LineDraft;
  onUpdate: (field: keyof Omit<LineDraft, "lineId">, value: string) => void;
}) {
  const fields = getLineActualFields(
    line.variant.name,
    line.variant.product.name,
    line.variant.presentation
  );
  const piecesLabel = getPiecesLabel(
    line.variant.name,
    line.variant.product.name,
    line.variant.presentation
  );
  const showGalvanId = showGalvanInternalIdField(fields, line, draft);

  if (!fields.weight && !fields.pieces) {
    return (
      <div className="rounded-lg border border-stone-200 p-3 text-sm">
        <p className="font-medium">
          {line.variant.product.name} — {line.variant.name}
        </p>
        <ProductGalvanReference
          reference={line.variant.product.galvanReference}
          compact
        />
        <p className="text-stone-500 mt-1">
          {formatLineOrderedSummary(line)}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 ${
        lineHasRequiredActuals(line)
          ? "border-stone-200"
          : "border-amber-300 bg-amber-50/50"
      }`}
    >
      <p className="font-medium text-stone-900">
        {line.variant.product.name} — {line.variant.name}
      </p>
      <ProductGalvanReference
        reference={line.variant.product.galvanReference}
        compact
      />
      <p className="text-xs text-stone-500 mt-1">
        Pedido: {formatLineOrderedSummary(line)}
      </p>
      {fields.weight && (
        <label className="mt-3 block text-sm font-medium text-stone-700">
          {HAM_WEIGHT_LABEL}
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.actualWeightKg}
            onChange={(e) => onUpdate("actualWeightKg", e.target.value)}
            className={inputClass}
            placeholder="Ej. 7,3"
          />
        </label>
      )}
      {fields.pieces && piecesLabel && (
        <label className="mt-3 block text-sm font-medium text-stone-700">
          {piecesLabel}
          <input
            type="number"
            min={0}
            step="1"
            value={draft.actualPieceCount}
            onChange={(e) => onUpdate("actualPieceCount", e.target.value)}
            className={inputClass}
            placeholder="Ej. 28"
          />
        </label>
      )}
      {showGalvanId && (
        <label className="mt-3 block text-sm font-medium text-stone-700">
          {GALVAN_INTERNAL_ID_LABEL}
          <input
            type="text"
            value={draft.galvanInternalId}
            onChange={(e) => onUpdate("galvanInternalId", e.target.value)}
            maxLength={100}
            className={inputClass}
            placeholder="Ej. GAL-2026-0142"
          />
        </label>
      )}
    </div>
  );
}

export function lineToDraft(line: {
  id: string;
  actualWeightKg: number | null;
  actualPieceCount: number | null;
  galvanInternalId: string | null;
}): LineDraft {
  return {
    lineId: line.id,
    actualWeightKg:
      line.actualWeightKg != null ? String(line.actualWeightKg) : "",
    actualPieceCount:
      line.actualPieceCount != null ? String(line.actualPieceCount) : "",
    galvanInternalId: line.galvanInternalId ?? "",
  };
}
