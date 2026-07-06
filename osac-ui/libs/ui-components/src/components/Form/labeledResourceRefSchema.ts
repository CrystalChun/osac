import * as yup from 'yup';

export const labeledResourceRefSchema = (requiredMessage: string) =>
  yup
    .object({
      value: yup.string(),
      label: yup.string(),
    })
    .test('required', requiredMessage, (value) => Boolean(value?.value?.trim()));

export const labeledResourceRefArraySchema = (requiredMessage: string) =>
  yup
    .array()
    .of(
      yup.object({
        value: yup.string().defined(),
        label: yup.string(),
      }),
    )
    .min(1, requiredMessage);
