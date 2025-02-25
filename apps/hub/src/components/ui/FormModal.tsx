import { BaseSyntheticEvent, PropsWithChildren, useEffect } from "react";
import {
  FieldPath,
  FieldValues,
  FormProvider,
  UseFormReturn,
} from "react-hook-form";

import { Button, Modal } from "@quri/ui";

type Props<TFieldValues extends FieldValues> = PropsWithChildren<{
  onSubmit: (event?: BaseSyntheticEvent) => void;
  close: () => void;
  submitText: string;
  title: string;
  inFlight?: boolean;
  form: UseFormReturn<TFieldValues, unknown, any>;
  initialFocus?: FieldPath<TFieldValues>;
}>;

// Common Modal component for forms.
export function FormModal<TFieldValues extends FieldValues>({
  onSubmit,
  close,
  submitText,
  title,
  inFlight,
  form,
  initialFocus,
  children,
}: Props<TFieldValues>) {
  useEffect(() => {
    if (initialFocus) {
      form.setFocus(initialFocus);
    }
  }, [form, initialFocus]);

  return (
    <Modal close={close}>
      <form onSubmit={onSubmit}>
        <FormProvider {...form}>
          <Modal.Header>{title}</Modal.Header>
          <Modal.Body>{children}</Modal.Body>
          <Modal.Footer>
            <Button
              type="submit"
              theme="primary"
              disabled={!form.formState.isValid || inFlight}
            >
              {submitText}
            </Button>
          </Modal.Footer>
        </FormProvider>
      </form>
    </Modal>
  );
}
