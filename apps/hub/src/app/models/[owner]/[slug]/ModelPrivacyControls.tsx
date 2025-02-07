"use client";
import { clsx } from "clsx";
import { FC } from "react";

import { Dropdown, DropdownMenu, GlobeIcon, LockIcon } from "@quri/ui";

import { SafeActionDropdownAction } from "@/components/ui/SafeActionDropdownAction";
import { updateModelPrivacyAction } from "@/models/actions/updateModelPrivacyAction";
import { ModelCardDTO } from "@/models/data/cards";

function getIconComponent(isPrivate: boolean) {
  return isPrivate ? LockIcon : GlobeIcon;
}

const UpdatePrivacyAction: FC<{
  model: ModelCardDTO;
}> = ({ model }) => {
  return (
    <SafeActionDropdownAction
      action={updateModelPrivacyAction}
      input={{
        owner: model.owner.slug,
        slug: model.slug,
        isPrivate: !model.isPrivate,
      }}
      title={model.isPrivate ? "Make public" : "Make private"}
      icon={getIconComponent(!model.isPrivate)}
      invariant={model.isPrivate}
    />
  );
};

export const ModelPrivacyControls: FC<{
  model: ModelCardDTO;
  isEditable: boolean;
}> = ({ model, isEditable }) => {
  const { isPrivate } = model;

  const Icon = getIconComponent(isPrivate);

  const body = (
    // TODO: copy-pasted from CacheMenu from relative-values, extract to <InvisibleMaybeDropdown> or something
    <div
      className={clsx(
        "rounded-xs flex items-center px-2 py-1 text-sm text-gray-500",
        isEditable && "cursor-pointer hover:bg-slate-200"
      )}
    >
      <Icon className="mr-1 text-gray-500" size={14} />
      {isPrivate ? "Private" : "Public"}
    </div>
  );

  return isEditable ? (
    <Dropdown
      render={() => (
        <DropdownMenu>
          <UpdatePrivacyAction model={model} />
        </DropdownMenu>
      )}
    >
      {body}
    </Dropdown>
  ) : (
    body
  );
};
