import type { Core } from "@strapi/strapi"

// Content types exposed through the public REST API.
const TOURNAMENT_CONTENT_TYPES = [
  "category",
  "player",
  "group",
  "match",
  "tournament",
] as const

// Actions granted to the public (unauthenticated) role.
const PUBLIC_ACTIONS = ["find", "findOne"]

// Actions granted to the authenticated role (full CRUD for the admin UI).
const AUTHENTICATED_ACTIONS = ["find", "findOne", "create", "update", "delete"]

const grantPermissions = async (
  strapi: Core.Strapi,
  roleType: "public" | "authenticated",
  actions: string[]
) => {
  const role = await strapi
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: roleType }, populate: ["permissions"] })

  if (!role) {
    strapi.log.warn(
      `Role "${roleType}" not found while bootstrapping permissions.`
    )
    return
  }

  const existingActions = new Set(
    (role.permissions ?? []).map(
      (permission: { action: string }) => permission.action
    )
  )

  const desiredActions = TOURNAMENT_CONTENT_TYPES.flatMap((contentType) =>
    actions.map((action) => `api::${contentType}.${contentType}.${action}`)
  )

  const missingActions = desiredActions.filter(
    (action) => !existingActions.has(action)
  )

  await Promise.all(
    missingActions.map((action) =>
      strapi.query("plugin::users-permissions.permission").create({
        data: { action, role: role.id },
      })
    )
  )

  if (missingActions.length > 0) {
    strapi.log.info(
      `Granted ${missingActions.length} "${roleType}" permission(s) for tournament content types.`
    )
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * Ensures the public role can read all tournament content types and the
   * authenticated role has full CRUD, so the API works out of the box.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPermissions(strapi, "public", PUBLIC_ACTIONS)
    await grantPermissions(strapi, "authenticated", AUTHENTICATED_ACTIONS)
  },
}
