import { request } from "./apiClient";

/**
 * Reoptimizes legacy media images (products, categories, banners).
 *
 * @param {Object} options
 * @param {boolean} [options.dryRun=true] - If true, only analyzes without making actual changes.
 * @param {number} [options.batchSize=25] - Number of items to process per batch.
 * @returns {Promise<Object>} Optimization results report.
 */
export function reoptimizeMedia({ dryRun = true, batchSize = 25 } = {}) {
  const query = new URLSearchParams({
    dryRun: String(Boolean(dryRun)),
    batchSize: String(Number(batchSize) || 25),
  });

  return request(`/admin/media/reoptimize?${query.toString()}`, {
    method: "POST",
  });
}
