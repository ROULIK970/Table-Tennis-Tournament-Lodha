// Public type surface for the @repo/strapi package.
//
// Strapi's deep internal paths (`@strapi/types/dist/...`) are unstable across
// releases and aren't needed here, so we expose only the stable `@strapi/strapi`
// namespaces plus the auto-generated content-type and component types.
export type { Utils, UID, Schema } from "@strapi/strapi"

export * from "./generated/contentTypes"

// NOTE: `./generated/components` is intentionally not re-exported. With no
// components defined, Strapi generates a comment-only (non-module) file, which
// breaks `export *`. Re-add the line if/when components are introduced.
