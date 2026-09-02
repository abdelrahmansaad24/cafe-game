const parseBoolean = (value: string | undefined) => {
  const normalized = (value ?? "false").trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(normalized);
};

export const featureFlags = {
  googleOAuthEnabled:
    parseBoolean(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH) ||
    parseBoolean(process.env.ENABLE_GOOGLE_OAUTH),
};
