import { apiBaseUrl, request } from "./apiClient";
import { getGuestSessionId } from "../utils/guestSession";
import { safeGetItem } from "../utils/storage";

export function uploadFile(
  file,
  purpose = "Product",
  ownerId = null,
  onProgress = null,
) {
  let purposeValue = "Product";
  if (
    purpose === "bannerVideo" ||
    purpose === "BannerVideo" ||
    purpose === "bannervideo"
  ) {
    purposeValue = "BannerVideo";
  } else if (purpose === "banner" || purpose === "Banner" || purpose === 2) {
    purposeValue = "Banner";
  } else if (purpose === "product" || purpose === "Product" || purpose === 1) {
    purposeValue = "Product";
  } else if (purpose === "user" || purpose === "User" || purpose === 0) {
    purposeValue = "User";
  } else if (purpose === "chat" || purpose === "Chat" || purpose === 3) {
    purposeValue = "Chat";
  } else if (purpose === "blog" || purpose === "Blog") {
    purposeValue = "Blog";
  }

  const isChat = purposeValue === "Chat";
  const guestSessionId = getGuestSessionId();
  const endpoint = isChat ? "/chat/files/upload" : "/admin/files/upload";

  const formData = new FormData();
  formData.append("file", file);

  if (isChat) {
    if (ownerId) {
      formData.append("conversationId", ownerId);
    }
    if (guestSessionId) {
      formData.append("guestSessionId", guestSessionId);
    }
  } else {
    formData.append("purpose", purposeValue);
    if (ownerId) {
      formData.append("ownerId", ownerId);
    }
  }

  if (onProgress && typeof XMLHttpRequest !== "undefined") {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBaseUrl}${endpoint}`);

      const token = safeGetItem("accessToken");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (guestSessionId) {
        xhr.setRequestHeader("X-Guest-Session-Id", guestSessionId);
        xhr.setRequestHeader("X-Guest-SessionId", guestSessionId);
      }

      if (xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve({ url: xhr.responseText });
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(
              new Error(errData.message || `Yükleme başarısız (${xhr.status})`),
            );
          } catch {
            reject(new Error(`Yükleme başarısız (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Ağ hatası oluştu."));
      xhr.send(formData);
    });
  }

  return request(endpoint, {
    method: "POST",
    body: formData,
  });
}
