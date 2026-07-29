import { useMemo } from 'react';
import { getCities, getDistricts, getNeighborhoods } from '../../utils/locationCatalog';

export default function LocationSelects({
  city,
  district,
  neighborhood,
  onCityChange,
  onDistrictChange,
  onNeighborhoodChange,
  fieldInputClass = '',
  labelClass = '',
  showLabels = true,
  selectStyle = {},
  wrapperClass = '',
}) {
  const cities = useMemo(() => getCities(), []);
  const districts = useMemo(() => getDistricts(city), [city]);
  const neighborhoods = useMemo(() => getNeighborhoods(city, district), [city, district]);

  const handleCitySelect = (e) => {
    const val = e.target.value;
    onCityChange(val);
    if (onDistrictChange) onDistrictChange('');
    if (onNeighborhoodChange) onNeighborhoodChange('');
  };

  const handleDistrictSelect = (e) => {
    const val = e.target.value;
    if (onDistrictChange) onDistrictChange(val);
    if (onNeighborhoodChange) onNeighborhoodChange('');
  };

  return (
    <>
      {/* Şehir (İl) */}
      <div className={wrapperClass}>
        {showLabels && <label className={labelClass}>Şehir (İl) *</label>}
        <select
          required
          value={city || ''}
          onChange={handleCitySelect}
          className={fieldInputClass}
          style={selectStyle}
        >
          <option value="">İl Seçin *</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          {city && !cities.includes(city) && (
            <option value={city}>{city}</option>
          )}
        </select>
      </div>

      {/* İlçe */}
      <div className={wrapperClass}>
        {showLabels && <label className={labelClass}>İlçe *</label>}
        <select
          required
          value={district || ''}
          onChange={handleDistrictSelect}
          disabled={!city}
          className={fieldInputClass}
          style={selectStyle}
        >
          <option value="">{city ? 'İlçe Seçin *' : 'Önce İl Seçin'}</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          {district && !districts.includes(district) && (
            <option value={district}>{district}</option>
          )}
        </select>
      </div>

      {/* Mahalle */}
      {onNeighborhoodChange && (
        <div className={wrapperClass}>
          {showLabels && <label className={labelClass}>Mahalle *</label>}
          <select
            required
            value={neighborhood || ''}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            disabled={!district}
            className={fieldInputClass}
            style={selectStyle}
          >
            <option value="">{district ? 'Mahalle Seçin *' : 'Önce İlçe Seçin'}</option>
            {neighborhoods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            {neighborhood && !neighborhoods.includes(neighborhood) && (
              <option value={neighborhood}>{neighborhood}</option>
            )}
          </select>
        </div>
      )}
    </>
  );
}
