export const normalizeProviders = (providers: any) =>
  Array.isArray(providers) ? providers : providers ? [providers] : [];

export const hasGoogleProvider = (providers: any[]) =>
  providers.some((p) => String(p || "").toLowerCase().includes("google"));

export const inferOauthUser = (user: any) => {
  if (!user) return false;
  try {
    if (Array.isArray(user.providers) && user.providers.length > 0) {
      const lower = user.providers.map((p: any) => String(p).toLowerCase());
      if (!lower.includes("password")) return true;
    }

    if (typeof user.has_password === "boolean" && user.has_password === false) return true;
    if (typeof user.hasPassword === "boolean" && user.hasPassword === false) return true;

    const providerFields = ["provider", "authProvider", "oauth_provider", "signInProvider", "sign_in_provider"];
    for (const k of providerFields) {
      const v = user[k];
      if (v && String(v).toLowerCase().includes("google")) {
        if (typeof user.hasPassword === "boolean" && user.hasPassword) break;
        if (typeof user.has_password === "boolean" && user.has_password) break;
        return true;
      }
    }

    if (user.googleId || user.google_id || user.google_uid) {
      if (typeof user.hasPassword === "boolean" && user.hasPassword) return false;
      if (typeof user.has_password === "boolean" && user.has_password) return false;
      return true;
    }
  } catch {
    // ignore and treat as non-oauth
  }
  return false;
};
