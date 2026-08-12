import { FiSearch, FiInfo, FiGlobe, FiAlertCircle } from 'react-icons/fi';
import { stripHtml } from '../../utils/seoHelpers';

export default function AdminSEOSection({
  seoTitle = '',
  onChangeSeoTitle,
  seoDescription = '',
  onChangeSeoDescription,
  seoKeywords = '',
  onChangeSeoKeywords,
  slug = '',
  onChangeSlug,
  fallbackTitle = '',
  fallbackDescription = '',
  baseUrl = 'https://muhristan.com/urun/',
  typeLabel = 'ürün',
  siteBrand = 'Muhristan'
}) {
  // Live Calculated Display Values
  const titleVal = seoTitle.trim();
  const descVal = seoDescription.trim();
  const slugVal = slug.trim().toLowerCase().replace(/\s+/g, '-');

  const displayTitle = titleVal || (fallbackTitle ? `${fallbackTitle} | ${siteBrand}` : `${siteBrand}`);
  const displayDesc = descVal || (stripHtml(fallbackDescription) || `${siteBrand} özel tasarım ${typeLabel} koleksiyonu.`);
  const displayUrl = `${baseUrl}${slugVal || 'sayfa-adresi'}`;

  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;

  return (
    <div style={{
      background: 'var(--bg-mid, #1a1625)',
      border: '1px solid var(--border-gold, rgba(201, 162, 39, 0.3))',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px',
      marginBottom: '16px'
    }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-gold, rgba(201, 162, 39, 0.2))', paddingBottom: '10px' }}>
        <FiSearch style={{ color: 'var(--gold, #c9a227)', fontSize: '18px' }} />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--gold-light, #f5d680)', letterSpacing: '0.03em' }}>
          SEO (Arama Motoru) Ayarları
        </h4>
      </div>

      {/* Notice Info Box */}
      <div style={{
        background: 'rgba(201, 162, 39, 0.08)',
        border: '1px solid rgba(201, 162, 39, 0.25)',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        fontSize: '12px',
        color: 'var(--text-secondary, #cbd5e1)',
        lineHeight: 1.5
      }}>
        <FiInfo style={{ color: 'var(--gold, #c9a227)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Otomatik SEO Mantığı:</strong> Bu alanları boş bırakırsanız sistem otomatik olarak {typeLabel} adından ve açıklamasından arama başlığı ve açıklaması oluşturur. Google'da özel görünmesini istiyorsanız aşağıdaki alanları doldurabilirsiniz.
        </span>
      </div>

      {/* Google Search Live Preview Card */}
      <div style={{
        background: '#ffffff',
        color: '#202124',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        border: '1px solid #dadce0',
        fontFamily: 'arial, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4d5156', marginBottom: '4px' }}>
          <FiGlobe style={{ color: '#1a0dab', fontSize: '12px' }} />
          <span>{displayUrl}</span>
        </div>
        <div style={{
          fontSize: '17px',
          fontWeight: '400',
          color: '#1a0dab',
          lineHeight: 1.3,
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {displayTitle}
        </div>
        <div style={{
          fontSize: '13px',
          color: '#4d5156',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {displayDesc}
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* SEO Title Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold, #c9a227)' }}>
              SEO Başlığı (`seoTitle`)
            </label>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: titleLength > 140 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: titleLength > 140 ? '#ef4444' : 'var(--text-secondary, #94a3b8)'
            }}>
              {titleLength} / 140 Karakter
            </span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => onChangeSeoTitle(e.target.value)}
            placeholder={`${fallbackTitle || 'Örn: Akik Taşlı Gümüş Yüzük'} | ${siteBrand}`}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'var(--bg-dark, #0f0a18)',
              border: `1px solid ${titleLength > 140 ? '#ef4444' : 'var(--border-gold, rgba(201, 162, 39, 0.3))'}`,
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
            Google arama sonuçlarında en üstte mavi/sarı başlık olarak görünür.
          </div>
          {titleLength > 140 && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiAlertCircle /> 140 karakteri aştınız (Google aramalarında başlığın sonu kesilebilir).
            </div>
          )}
        </div>

        {/* SEO Description Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold, #c9a227)' }}>
              SEO Açıklaması (`seoDescription`)
            </label>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: descLength > 160 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: descLength > 160 ? '#ef4444' : 'var(--text-secondary, #94a3b8)'
            }}>
              {descLength} / 160 Karakter
            </span>
          </div>
          <textarea
            rows={3}
            value={seoDescription}
            onChange={(e) => onChangeSeoDescription(e.target.value)}
            placeholder="Google arama sonuçlarında başlığın altında görünecek özgün kısa açıklama..."
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'var(--bg-dark, #0f0a18)',
              border: `1px solid ${descLength > 160 ? '#ef4444' : 'var(--border-gold, rgba(201, 162, 39, 0.3))'}`,
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical'
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
            Arama sonuçlarında başlığın altında çıkan özet açıklamadır.
          </div>
          {descLength > 160 && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiAlertCircle /> 160 karakteri aştınız (Google arama sonuçlarında açıklama kesilebilir).
            </div>
          )}
        </div>

        {/* SEO Keywords Input */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold, #c9a227)', display: 'block', marginBottom: '4px' }}>
            SEO Anahtar Kelimeleri (`seoKeywords`) - İsteğe Bağlı
          </label>
          <input
            type="text"
            value={seoKeywords}
            onChange={(e) => onChangeSeoKeywords(e.target.value)}
            placeholder="akik yüzük, tılsımlı yüzük, doğal taş yüzük"
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'var(--bg-dark, #0f0a18)',
              border: '1px solid var(--border-gold, rgba(201, 162, 39, 0.3))',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
            Kelime veya kelime öbeklerini virgülle ayırabilirsiniz. Modern Google aramalarında ikincil önemdedir.
          </div>
        </div>

        {/* Slug Input */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold, #c9a227)', display: 'block', marginBottom: '4px' }}>
            Sayfa Adresi (URL Slug - `slug`)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => onChangeSlug(e.target.value)}
            placeholder="akik-tasli-gumus-yuzuk"
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'var(--bg-dark, #0f0a18)',
              border: '1px solid var(--border-gold, rgba(201, 162, 39, 0.3))',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
            Sitedeki sayfa bağlantısının son kısmıdır. Boş bırakırsanız başlıktan otomatik türetilir.
          </div>
        </div>
      </div>
    </div>
  );
}
