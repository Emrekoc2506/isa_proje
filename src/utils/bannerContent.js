export const DEFAULT_CONTENT = {
  quote: "",
  description: "",
  features: [],
  specs: [],
  sections: []
};

export function parseBannerContent(value) {
  if (!value) return DEFAULT_CONTENT;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;

    return {
      quote: parsed.quote || "",
      description: parsed.description || "",
      features: Array.isArray(parsed.features)
        ? parsed.features.map(f => ({
            title: f.title ? String(f.title).trim() : "",
            description: f.description != null
              ? String(f.description).trim()
              : (f.desc != null ? String(f.desc).trim() : "")
          }))
        : [],
      specs: Array.isArray(parsed.specs)
        ? parsed.specs.map(s => ({
            key: s.key ? String(s.key).trim() : "",
            value: s.value ? String(s.value).trim() : ""
          }))
        : [],
      sections: Array.isArray(parsed.sections)
        ? parsed.sections.map(sec => ({
            title: sec.title ? String(sec.title).trim() : "",
            body: sec.body ? String(sec.body).trim() : ""
          }))
        : []
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}
