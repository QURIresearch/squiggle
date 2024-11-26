"use client";
import { ChooseUsernameMutation } from "@gen/ChooseUsernameMutation.graphql";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";
import { graphql } from "relay-runtime";

import { Button } from "@quri/ui";

import { SlugFormField } from "@/components/ui/SlugFormField";
import { useMutationForm } from "@/hooks/useMutationForm";

export const ChooseUsername: FC<{ session: Session | null }> = ({
  session,
}) => {
  const router = useRouter();
  if (session?.user.username) {
    router.replace("/");
  }

  type FormShape = {
    username: string;
  };

  const { form, onSubmit, inFlight } = useMutationForm<
    FormShape,
    ChooseUsernameMutation,
    "Me"
  >({
    mode: "onChange",
    mutation: graphql`
      mutation ChooseUsernameMutation($username: String!) {
        result: setUsername(username: $username) {
          __typename
          ... on BaseError {
            message
          }
          ... on Me {
            email
          }
        }
      }
    `,
    expectedTypename: "Me",
    formDataToVariables: (data) => ({ username: data.username }),
    onCompleted: () => {
      router.refresh();
    },
    blockOnSuccess: true,
  });

  const disabled = inFlight || !form.formState.isValid;

  return (
    <form onSubmit={onSubmit}>
      <FormProvider {...form}>
        <div className="mt-20 flex flex-col items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <SlugFormField<FormShape>
                placeholder="Username"
                name="username"
                label="Pick a username"
                size="small"
              />
              <Button onClick={onSubmit} disabled={disabled} theme="primary">
                Save
              </Button>
            </div>
          </div>
        </div>
      </FormProvider>
    </form>
  );
};
