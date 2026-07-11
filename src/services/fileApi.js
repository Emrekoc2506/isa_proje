import { request } from "./apiClient";

export function uploadFile(file, folder = "general", ownerType = null, ownerId = null) {
  const formData = new FormData();
  formData.append("file", file);
  
  if (folder) formData.append("folder", folder);
  if (ownerType) formData.append("ownerType", ownerType);
  if (ownerId) formData.append("ownerId", ownerId);

  return request("/files/upload", {
    method: "POST",
    body: formData
  });
}
