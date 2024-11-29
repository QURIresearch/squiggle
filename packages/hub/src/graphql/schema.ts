import "./errors/BaseError";
import "./errors/NotFoundError";
import "./errors/ValidationError";
import "./queries/group";
import "./queries/me";
import "./queries/model";
import "./queries/variable";
import "./queries/relativeValuesDefinition";
import "./queries/relativeValuesDefinitions";
import "./queries/runSquiggle";
import "./queries/userByUsername";
import "./mutations/adminUpdateModelVersion";
import "./mutations/adminRebuildSearchIndex";
import "./mutations/buildRelativeValuesCache";
import "./mutations/cancelGroupInvite";
import "./mutations/clearRelativeValuesCache";
import "./mutations/createGroup";
import "./mutations/createRelativeValuesDefinition";
import "./mutations/deleteRelativeValuesDefinition";
import "./mutations/updateRelativeValuesDefinition";
import "./mutations/updateSquiggleSnippetModel";

import { builder } from "./builder";

export const schema = builder.toSchema();
