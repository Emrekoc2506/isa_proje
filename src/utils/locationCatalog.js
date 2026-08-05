import locationData from '../data/turkiye-il-ilce-mahalle.json';

function normalizeKey(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

/**
 * Türkiye'deki tüm il isimlerinin listesini döndürür.
 * @returns {string[]} İller dizisi (alfabetik sıralı)
 */
export function getCities() {
  if (!locationData) return [];
  return Object.keys(locationData).sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * Seçilen ile ait ilçe isimlerinin listesini döndürür.
 * @param {string} cityName - İl adı
 * @returns {string[]} İlçeler dizisi (alfabetik sıralı)
 */
export function getDistricts(cityName) {
  if (!cityName || !locationData) return [];
  const targetCityKey = normalizeKey(cityName);
  const cityKey = Object.keys(locationData).find(
    (key) => normalizeKey(key) === targetCityKey
  );
  if (!cityKey || !locationData[cityKey]) return [];
  return Object.keys(locationData[cityKey]).sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * Seçilen il ve ilçeye ait mahalle isimlerinin listesini döndürür.
 * @param {string} cityName - İl adı
 * @param {string} districtName - İlçe adı
 * @returns {string[]} Mahalleler dizisi (alfabetik sıralı)
 */
export function getNeighborhoods(cityName, districtName) {
  if (!cityName || !districtName || !locationData) return [];
  const targetCityKey = normalizeKey(cityName);
  const cityKey = Object.keys(locationData).find(
    (key) => normalizeKey(key) === targetCityKey
  );
  if (!cityKey || !locationData[cityKey]) return [];

  const targetDistrictKey = normalizeKey(districtName);
  const districtKey = Object.keys(locationData[cityKey]).find(
    (key) => normalizeKey(key) === targetDistrictKey
  );
  if (!districtKey || !Array.isArray(locationData[cityKey][districtKey])) return [];

  return locationData[cityKey][districtKey].slice().sort((a, b) => a.localeCompare(b, 'tr'));
}
