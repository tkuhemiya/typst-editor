const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const sanitizeStem = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const pad = (value: number) => String(value).padStart(2, "0");

export const buildImageFilename = (originalName: string): string => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const extension = originalName.toLowerCase().split(".").pop() || "png";
  const shortId = Math.random().toString(36).slice(2, 8);
  const stem = sanitizeStem(originalName.split(".").slice(0, -1).join(".")) || "image";
  return `${stem}-${stamp}-${shortId}.${extension}`;
};

export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) return "Only image files are supported.";
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image is too large (max 10MB).";
  }
  return null;
};
