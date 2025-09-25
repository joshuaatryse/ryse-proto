/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as advances from "../advances.js";
import type * as auth from "../auth.js";
import type * as emails from "../emails.js";
import type * as googleMaps from "../googleMaps.js";
import type * as insights from "../insights.js";
import type * as invitations from "../invitations.js";
import type * as marketing from "../marketing.js";
import type * as notifications from "../notifications.js";
import type * as owners from "../owners.js";
import type * as properties from "../properties.js";
import type * as propertyManagers from "../propertyManagers.js";
import type * as seed from "../seed.js";
import type * as seedAdvances from "../seedAdvances.js";
import type * as seedPropertiesForAdvances from "../seedPropertiesForAdvances.js";
import type * as syncProperties from "../syncProperties.js";
import type * as syncPropertiesWithImages from "../syncPropertiesWithImages.js";
import type * as updateOwnerEmails from "../updateOwnerEmails.js";
import type * as updatePropertyStatuses from "../updatePropertyStatuses.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  advances: typeof advances;
  auth: typeof auth;
  emails: typeof emails;
  googleMaps: typeof googleMaps;
  insights: typeof insights;
  invitations: typeof invitations;
  marketing: typeof marketing;
  notifications: typeof notifications;
  owners: typeof owners;
  properties: typeof properties;
  propertyManagers: typeof propertyManagers;
  seed: typeof seed;
  seedAdvances: typeof seedAdvances;
  seedPropertiesForAdvances: typeof seedPropertiesForAdvances;
  syncProperties: typeof syncProperties;
  syncPropertiesWithImages: typeof syncPropertiesWithImages;
  updateOwnerEmails: typeof updateOwnerEmails;
  updatePropertyStatuses: typeof updatePropertyStatuses;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
