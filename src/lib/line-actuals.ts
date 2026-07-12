import type { VariantPresentation } from "@prisma/client";
import {
  HAM_LONCHEADO_PACKAGES_PER_UNIT,
  HAM_PLATEADO_PLATES_PER_UNIT,
  LOMITO_KG_ESTIMATE,
  formatOrderedUnitsAbbrev,
  getVariantKind,
  inferStoredLineUnits,
  resolveLineVatRate,
} from "@/lib/order-estimates";
import { calcVatCents } from "@/lib/pricing";

export interface LineActualFields {
  weight: boolean;
  pieces: boolean;
}

export interface LineForActuals {
  actualWeightKg: number | null;
  actualPieceCount: number | null;
  lineTotalCents: number;
  unitPriceCents: number;
  quantity: number;
  variant: {
    name: string;
    unitLabel: string;
    vatRate: number;
    presentation?: VariantPresentation;
    product?: { name: string };
  };
}

export interface LineActualDraft {
  actualWeightKg: string;
  actualPieceCount: string;
}

export const GALVAN_INTERNAL_ID_LABEL =
  "Nº identificación interna Galvan (opcional)";

export const HAM_WEIGHT_LABEL = "Peso real del jamón (kg)";
export const PACKAGES_LABEL = "Paquetes reales";
export const PLATES_LABEL = "Platos reales";

export function getLineActualFields(
  variantName: string,
  productName?: string,
  presentation?: VariantPresentation | null
): LineActualFields {
  const kind = getVariantKind(variantName, productName, presentation);
  switch (kind) {
    case "whole_ham":
    case "lomito":
      return { weight: true, pieces: false };
    case "ham_loncheado":
    case "ham_plateado":
      return { weight: true, pieces: true };
    default:
      return { weight: false, pieces: false };
  }
}

export function lineNeedsActuals(
  variantName: string,
  productName?: string,
  presentation?: import("@prisma/client").VariantPresentation | null
): boolean {
  const fields = getLineActualFields(variantName, productName, presentation);
  return fields.weight || fields.pieces;
}

export function getPiecesLabel(
  variantName: string,
  productName?: string,
  presentation?: VariantPresentation | null
): string | null {
  const kind = getVariantKind(variantName, productName, presentation);
  if (kind === "ham_loncheado") return PACKAGES_LABEL;
  if (kind === "ham_plateado") return PLATES_LABEL;
  return null;
}

/** @deprecated Use getLineActualFields */
export type LineActualRequirement = "weight" | "pieces" | "weight_and_pieces" | null;

export function getLineActualRequirement(
  variantName: string,
  productName?: string
): LineActualRequirement {
  const fields = getLineActualFields(variantName, productName);
  if (fields.weight && fields.pieces) return "weight_and_pieces";
  if (fields.weight) return "weight";
  if (fields.pieces) return "pieces";
  return null;
}

export function draftHasAnyActualValue(
  fields: LineActualFields,
  draft: LineActualDraft
): boolean {
  if (fields.weight) {
    const v = parseFloat(draft.actualWeightKg);
    if (Number.isFinite(v) && v > 0) return true;
  }
  if (fields.pieces) {
    const v = parseFloat(draft.actualPieceCount);
    if (Number.isFinite(v) && v > 0) return true;
  }
  return false;
}

export function showGalvanInternalIdField(
  fields: LineActualFields,
  line: LineForActuals,
  draft: LineActualDraft
): boolean {
  if (!fields.weight && !fields.pieces) return false;
  return lineHasRequiredActuals(line) || draftHasAnyActualValue(fields, draft);
}

export function lineHasRequiredActuals(line: LineForActuals): boolean {
  const productName = line.variant.product?.name;
  const presentation = line.variant.presentation;
  const fields = getLineActualFields(
    line.variant.name,
    productName,
    presentation
  );
  if (fields.weight) {
    if (line.actualWeightKg == null || line.actualWeightKg <= 0) return false;
  }
  if (fields.pieces) {
    if (line.actualPieceCount == null || line.actualPieceCount <= 0) return false;
  }
  return true;
}

export function orderHasRequiredActuals(lines: LineForActuals[]): boolean {
  return lines.every(lineHasRequiredActuals);
}

export function getLineMissingActualsLabels(line: LineForActuals): string[] {
  const productName = line.variant.product?.name;
  const presentation = line.variant.presentation;
  const fields = getLineActualFields(
    line.variant.name,
    productName,
    presentation
  );
  const missing: string[] = [];
  if (fields.weight && (line.actualWeightKg == null || line.actualWeightKg <= 0)) {
    missing.push(HAM_WEIGHT_LABEL);
  }
  if (fields.pieces) {
    const piecesLabel = getPiecesLabel(
      line.variant.name,
      productName,
      presentation
    );
    if (
      piecesLabel &&
      (line.actualPieceCount == null || line.actualPieceCount <= 0)
    ) {
      missing.push(piecesLabel);
    }
  }
  return missing;
}

export function getOrderMissingActualsMessage(
  lines: LineForActuals[]
): string | null {
  const missingLines = lines
    .map((line) => ({
      name: line.variant.name,
      labels: getLineMissingActualsLabels(line),
    }))
    .filter((entry) => entry.labels.length > 0);

  if (missingLines.length === 0) return null;

  const detail = missingLines
    .map((entry) => `${entry.name}: ${entry.labels.join(", ")}`)
    .join("; ");

  return `Falta información obligatoria (${detail}). Complete los datos antes de mover el pedido.`;
}

export function validateLineDraft(
  line: LineForActuals,
  draft: LineActualDraft
): string | null {
  const productName = line.variant.product?.name;
  const presentation = line.variant.presentation;
  const fields = getLineActualFields(
    line.variant.name,
    productName,
    presentation
  );
  if (fields.weight) {
    const val = parseFloat(draft.actualWeightKg);
    if (!Number.isFinite(val) || val <= 0) {
      return `Indique el peso real del jamón para ${line.variant.name}`;
    }
  }
  if (fields.pieces) {
    const val = parseFloat(draft.actualPieceCount);
    const label =
      getPiecesLabel(line.variant.name, productName, presentation) ??
      "unidades";
    if (!Number.isFinite(val) || val <= 0) {
      return `Indique ${label.toLowerCase()} para ${line.variant.name}`;
    }
  }
  return null;
}

export function buildLineActualPayload(
  line: LineForActuals,
  draft: LineActualDraft & { galvanInternalId: string }
) {
  const productName = line.variant.product?.name;
  const presentation = line.variant.presentation;
  const fields = getLineActualFields(
    line.variant.name,
    productName,
    presentation
  );
  return {
    actualWeightKg: fields.weight
      ? parseFloat(draft.actualWeightKg)
      : undefined,
    actualPieceCount: fields.pieces
      ? parseFloat(draft.actualPieceCount)
      : undefined,
    galvanInternalId:
      fields.weight || fields.pieces
        ? showGalvanInternalIdField(fields, line, draft)
          ? draft.galvanInternalId.trim() || null
          : undefined
        : undefined,
  };
}

export function calcLineTotalFromActuals(line: LineForActuals): number {
  const kind = getVariantKind(
    line.variant.name,
    line.variant.product?.name,
    line.variant.presentation
  );
  switch (kind) {
    case "whole_ham":
    case "lomito":
      return Math.round(line.unitPriceCents * (line.actualWeightKg ?? 0));
    case "ham_loncheado":
    case "ham_plateado":
      return Math.round(line.unitPriceCents * (line.actualPieceCount ?? 0));
    default:
      return line.lineTotalCents;
  }
}

export function formatLineOrderedSummary(line: LineForActuals): string {
  const units = inferStoredLineUnits({
    quantity: line.quantity,
    variant: line.variant,
  });
  const kind = getVariantKind(
    line.variant.name,
    line.variant.product?.name,
    line.variant.presentation
  );

  switch (kind) {
    case "whole_ham":
      return `${units} unid. (estimado 7–7,5 kg c/u)`;
    case "ham_loncheado":
      return `${formatOrderedUnitsAbbrev(units, kind)} (~${units * HAM_LONCHEADO_PACKAGES_PER_UNIT} sobres estimados)`;
    case "ham_plateado":
      return `${formatOrderedUnitsAbbrev(units, kind)} (~${units * HAM_PLATEADO_PLATES_PER_UNIT} platos estimados)`;
    case "lomito":
      return `${units} unid. (~${Math.round(units * LOMITO_KG_ESTIMATE * 1000)} g estimados)`;
    default:
      return `${Math.round(line.quantity)} ${line.variant.unitLabel}`;
  }
}

export function buildLineVatInputs(
  lines: Array<LineForActuals & { lineTotalCents: number }>
) {
  return lines.map((line) => ({
    lineTotalCents: calcLineTotalFromActuals(line),
    vatRate: resolveLineVatRate(
      line.variant.name,
      line.variant.vatRate,
      line.variant.product?.name,
      line.variant.presentation
    ),
  }));
}

export function calcOrderTotalsFromActuals(
  lines: LineForActuals[],
  shippingCostCents: number
) {
  const vatInputs = buildLineVatInputs(lines);
  const subtotalCents = vatInputs.reduce((s, l) => s + l.lineTotalCents, 0);
  const vatCents = vatInputs.reduce(
    (s, l) => s + calcVatCents(l.lineTotalCents, l.vatRate),
    0
  );
  return {
    subtotalCents,
    vatCents,
    totalCents: subtotalCents + vatCents + shippingCostCents,
  };
}
