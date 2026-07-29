import { request } from "./apiClient";
import { getCities, getDistricts } from "../data/turkiyeLocations";

export async function fetchCities() {
  try {
    const res = await request("/locations/cities");
    if (res && Array.isArray(res) && res.length > 0) return res.map(c => typeof c === 'string' ? c : (c.name || c.cityName || c.city));
    if (res && Array.isArray(res.items)) return res.items.map(c => typeof c === 'string' ? c : (c.name || c.cityName || c.city));
  } catch {
    try {
      const res2 = await request("/locations");
      if (res2 && Array.isArray(res2) && res2.length > 0) return res2.map(c => typeof c === 'string' ? c : (c.name || c.cityName || c.city));
    } catch {
      // Backend servis henüz aktif değilse yerel veri kataloğunu kullan
    }
  }
  return getCities();
}

export async function fetchDistricts(cityName) {
  if (!cityName) return [];
  try {
    const res = await request(`/locations/districts?city=${encodeURIComponent(cityName)}`);
    if (res && Array.isArray(res) && res.length > 0) return res.map(d => typeof d === 'string' ? d : (d.name || d.districtName || d.district));
    if (res && Array.isArray(res.items)) return res.items.map(d => typeof d === 'string' ? d : (d.name || d.districtName || d.district));
  } catch {
    try {
      const res2 = await request(`/locations/${encodeURIComponent(cityName)}/districts`);
      if (res2 && Array.isArray(res2) && res2.length > 0) return res2.map(d => typeof d === 'string' ? d : (d.name || d.districtName || d.district));
    } catch {
      // Backend servis henüz aktif değilse yerel veri kataloğunu kullan
    }
  }
  return getDistricts(cityName);
}
