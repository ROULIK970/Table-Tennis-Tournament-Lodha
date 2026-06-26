export default () => ({
  // Users & Permissions powers the read-only public API and the API tokens
  // used by the Next.js frontend's server components.
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "30d",
      },
    },
  },

  // Local file storage is the default; no external object storage is needed
  // for a single event site.
  upload: {
    config: {
      sizeLimit: 50 * 1024 * 1024, // 50 MB
    },
  },
})
