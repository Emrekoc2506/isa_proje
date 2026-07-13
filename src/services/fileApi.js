import { request } from "./apiClient";

export function uploadFile(file, purpose = "Product", ownerId = null) {
  const formData = new FormData();
  formData.append("file", file);
  
  // Map friendly names to FileUploadPurpose enum values (or strings)
  let purposeValue = "Product";
  if (purpose === "banner" || purpose === "Banner" || purpose === 2) {
    purposeValue = "Banner";
  } else if (purpose === "product" || purpose === "Product" || purpose === 1) {
    purposeValue = "Product";
  } else if (purpose === "user" || purpose === "User" || purpose === 0) {
    purposeValue = "User";
  } else if (purpose === "chat" || purpose === "Chat" || purpose === 3) {
    purposeValue = "Chat";
  }

  formData.append("purpose", purposeValue);
  if (ownerId) {
    formData.append("ownerId", ownerId);
  }

  return request("/admin/files/upload", {
    method: "POST",
    body: formData
  });
}
