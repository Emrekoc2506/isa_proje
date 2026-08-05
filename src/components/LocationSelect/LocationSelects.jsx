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

  const optionStyle = { background: '#1b0e2b', color: '#ffffff' };

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
          style={{ ...selectStyle, cursor: 'pointer' }}
        >
          <option value="" style={optionStyle}>İl Seçin *</option>
          {cities.map((c) => (
            <option key={c} value={c} style={optionStyle}>{c}</option>
          ))}
          {city && !cities.includes(city) && (
            <option value={city} style={optionStyle}>{city}</option>
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
          style={{ ...selectStyle, cursor: city ? 'pointer' : 'not-allowed', opacity: city ? 1 : 0.6 }}
        >
          <option value="" style={optionStyle}>{city ? 'İlçe Seçin *' : 'Önce İl Seçin'}</option>
          {districts.map((d) => (
            <option key={d} value={d} style={optionStyle}>{d}</option>
          ))}
          {district && !districts.includes(district) && (
            <option value={district} style={optionStyle}>{district}</option>
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
            style={{ ...selectStyle, cursor: district ? 'pointer' : 'not-allowed', opacity: district ? 1 : 0.6 }}
          >
            <option value="" style={optionStyle}>{district ? 'Mahalle Seçin *' : 'Önce İlçe Seçin'}</option>
            {neighborhoods.map((m) => (
              <option key={m} value={m} style={optionStyle}>{m}</option>
            ))}
            {neighborhood && !neighborhoods.includes(neighborhood) && (
              <option value={neighborhood} style={optionStyle}>{neighborhood}</option>
            )}
          </select>
        </div>
      )}
    </>
  );
}
