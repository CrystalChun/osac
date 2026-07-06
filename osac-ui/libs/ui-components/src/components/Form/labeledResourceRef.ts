/** Form value for a picker that stores both API id and display label. */
export interface LabeledResourceRef {
  value: string;
  label: string;
}

export const EMPTY_LABELED_RESOURCE_REF: LabeledResourceRef = { value: '', label: '' };

export const isLabeledResourceRefEmpty = (ref?: LabeledResourceRef | null): boolean =>
  !ref?.value?.trim();

export const formatLabeledResourceRefForReview = (ref: LabeledResourceRef): string => {
  const display = ref.label.trim() || ref.value.trim();
  return display || '—';
};

export const formatLabeledResourceRefsForReview = (refs: LabeledResourceRef[]): string => {
  if (refs.length === 0) {
    return '—';
  }
  return refs.map((ref) => ref.label.trim() || ref.value.trim()).join(', ');
};
