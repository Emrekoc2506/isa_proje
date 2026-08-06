export const DEFAULT_CONTENT = {
  quote: "",
  description: "",
  features: [],
  specs: [],
  sections: [],
  mediaType: "image",
  mediaSource: "file",
  themeMode: "all",
  imageDark: "",
  imageMobileDark: "",
  videoUrl: "",
  mobileVideoUrl: "",
  posterImageUrl: "",
  mobilePosterImageUrl: "",
  autoplay: false,
  loop: false,
  muted: false
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
        : [],
      mediaType: parsed.mediaType || (parsed.videoUrl ? "video" : "image"),
      mediaSource: parsed.mediaSource || "file",
      themeMode: parsed.themeMode || "all",
      imageDark: parsed.imageDark || "",
      imageMobileDark: parsed.imageMobileDark || "",
      videoUrl: parsed.videoUrl || "",
      mobileVideoUrl: parsed.mobileVideoUrl || "",
      posterImageUrl: parsed.posterImageUrl || parsed.image || "",
      mobilePosterImageUrl: parsed.mobilePosterImageUrl || parsed.imageMobile || "",
      autoplay: Boolean(parsed.autoplay ?? parsed.autoPlay),
      loop: Boolean(parsed.loop),
      muted: Boolean(parsed.muted || (parsed.autoplay ?? parsed.autoPlay))
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}

