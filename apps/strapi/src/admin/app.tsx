import type { StrapiApp } from "@strapi/strapi/admin"

export default {
  config: {
    locales: ["en"],
  },
  bootstrap(app: StrapiApp) {
    // eslint-disable-next-line no-console
    console.log(app)
  },
}
