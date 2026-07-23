import { useState, useEffect } from 'react';
import { FiPlus, FiMapPin, FiPhone, FiTrash2, FiEdit3, FiCheck, FiBriefcase, FiUser } from 'react-icons/fi';
import * as accountApi from '../../services/accountApi';
import styles from './DashboardPage.module.css';

export default function AddressesSection() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // false | 'create' | 'edit'
  const [currentAddress, setCurrentAddress] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('TR');
  const [addressType, setAddressType] = useState('Shipping'); // 'Shipping' | 'Billing' | 'Both'
  const [isCorporate, setIsCorporate] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [tcIdentificationNumber, setTcIdentificationNumber] = useState('');

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await accountApi.getAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenCreate = () => {
    setCurrentAddress(null);
    setTitle('');
    setFullName('');
    setPhoneNumber('');
    setCity('');
    setDistrict('');
    setNeighborhood('');
    setAddressLine('');
    setPostalCode('');
    setCountry('TR');
    setAddressType('Both');
    setIsCorporate(false);
    setCompanyName('');
    setTaxOffice('');
    setTaxNumber('');
    setTcIdentificationNumber('');
    setErrorMsg('');
    setEditMode('create');
  };

  const handleOpenEdit = (addr) => {
    setCurrentAddress(addr);
    setTitle(addr.title || '');
    setFullName(addr.fullName || '');
    setPhoneNumber(addr.phoneNumber || '');
    setCity(addr.city || '');
    setDistrict(addr.district || '');
    setNeighborhood(addr.neighborhood || '');
    setAddressLine(addr.addressLine || '');
    setPostalCode(addr.postalCode || '');
    setCountry(addr.country || 'TR');
    setAddressType(addr.addressType || 'Both');
    setIsCorporate(addr.isCorporate || false);
    setCompanyName(addr.companyName || '');
    setTaxOffice(addr.taxOffice || '');
    setTaxNumber(addr.taxNumber || '');
    setTcIdentificationNumber(addr.tcIdentificationNumber || '');
    setErrorMsg('');
    setEditMode('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Telefon numarasını 5xx xxx xx xx (10 haneli) formatına temizle
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('90')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    const payload = {
      title,
      fullName,
      phoneNumber: cleanPhone,
      city,
      district,
      neighborhood,
      addressLine,
      postalCode: postalCode || null,
      country: country || 'TR',
      type: addressType,
      isCorporate,
      companyName: isCorporate ? companyName : null,
      taxOffice: isCorporate ? taxOffice : null,
      taxNumber: isCorporate ? taxNumber : null,
      nationalIdentityNumber: !isCorporate ? tcIdentificationNumber : null,
    };

    try {
      if (editMode === 'create') {
        await accountApi.createAddress(payload);
      } else {
        await accountApi.updateAddress(currentAddress.id, payload);
      }
      setEditMode(false);
      loadAddresses();
    } catch (err) {
      setErrorMsg(err.message || 'Adres kaydedilemedi.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu adresi silmek istediğinize emin misiniz?')) {
      try {
        await accountApi.deleteAddress(id);
        loadAddresses();
      } catch (err) {
        alert(err.message || 'Adres silinemedi.');
      }
    }
  };

  const handleSetDefaultShipping = async (id) => {
    try {
      await accountApi.setDefaultShipping(id);
      loadAddresses();
    } catch (err) {
      alert(err.message || 'Varsayılan teslimat adresi belirlenemedi.');
    }
  };

  const handleSetDefaultBilling = async (id) => {
    try {
      await accountApi.setDefaultBilling(id);
      loadAddresses();
    } catch (err) {
      alert(err.message || 'Varsayılan fatura adresi belirlenemedi.');
    }
  };

  if (loading && addresses.length === 0) {
    return <p className={styles.emptyText}>Adresler yükleniyor...</p>;
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Adreslerim</h3>
        {!editMode && (
          <button onClick={handleOpenCreate} className={styles.shopBtn} style={{ padding: '8px 16px', fontSize: 13 }}>
            <FiPlus /> Yeni Adres Ekle
          </button>
        )}
      </div>

      {editMode ? (
        <form onSubmit={handleSave} className={styles.profileForm}>
          {errorMsg && <div style={{ color: '#e05594', fontSize: 13, marginBottom: 16 }}>{errorMsg}</div>}
          
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Adres Başlığı *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Ev, İş" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Ad Soyad *</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Alıcının adı soyadı" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Telefon *</label>
              <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Örn: 5551234567" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Ülke *</label>
              <input type="text" required value={country} onChange={e => setCountry(e.target.value)} placeholder="Örn: TR" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Şehir *</label>
              <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="İl girin" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>İlçe *</label>
              <input type="text" required value={district} onChange={e => setDistrict(e.target.value)} placeholder="İlçe girin" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Mahalle *</label>
              <input type="text" required value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Mahalle girin" className={styles.fieldInput} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Posta Kodu *</label>
              <input type="text" required value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Posta kodu" className={styles.fieldInput} />
            </div>

            <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
              <label className={styles.fieldLabel}>Açık Adres *</label>
              <textarea required value={addressLine} onChange={e => setAddressLine(e.target.value)} placeholder="Sokak, bina no, daire no vb." className={styles.fieldInput} rows={3} style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Adres Tipi *</label>
              <select value={addressType} onChange={e => setAddressType(e.target.value)} className={styles.fieldInput} style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
                <option value="Both">Hem Teslimat Hem Fatura</option>
                <option value="Shipping">Sadece Teslimat</option>
                <option value="Billing">Sadece Fatura</option>
              </select>
            </div>

            <div className={styles.formField} style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="isCorporate" checked={isCorporate} onChange={e => setIsCorporate(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label htmlFor="isCorporate" style={{ color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Bu bir kurumsal adrestir (Fatura detayları gerekir)</label>
            </div>

            {isCorporate ? (
              <>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Şirket Adı *</label>
                  <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Şirket resmi adı" className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Vergi Dairesi *</label>
                  <input type="text" required value={taxOffice} onChange={e => setTaxOffice(e.target.value)} placeholder="Vergi dairesi" className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Vergi Numarası *</label>
                  <input type="text" required value={taxNumber} onChange={e => setTaxNumber(e.target.value)} placeholder="Vergi numarası" className={styles.fieldInput} />
                </div>
              </>
            ) : (
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>T.C. Kimlik Numarası (Opsiyonel)</label>
                <input type="text" value={tcIdentificationNumber} onChange={e => setTcIdentificationNumber(e.target.value)} placeholder="TCKN girin" className={styles.fieldInput} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" className={styles.shopBtn}>Kaydet</button>
            <button type="button" onClick={() => setEditMode(false)} className={styles.seeAllBtn}>İptal</button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {addresses.map(addr => (
            <div key={addr.id} className={styles.addressRow} style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: 'var(--gold-light)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiMapPin /> {addr.title}
                    {addr.isCorporate && <span style={{ fontSize: 10, background: 'rgba(201,162,39,0.15)', border: '1px solid var(--border-gold)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 4 }}><FiBriefcase style={{ display: 'inline', marginRight: 2 }} /> Kurumsal</span>}
                  </h4>
                  <p style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: 14, margin: '0 0 4px 0' }}>{addr.fullName}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}><FiPhone /> {addr.phoneNumber}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 8px 0' }}>
                    {addr.neighborhood}, {addr.addressLine} {addr.district}/{addr.city} {addr.postalCode} {addr.country}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {addr.isDefaultShipping ? (
                      <span style={{ fontSize: 11, color: '#2ecc71', background: 'rgba(46,204,113,0.1)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FiCheck /> Varsayılan Teslimat</span>
                    ) : (
                      <button onClick={() => handleSetDefaultShipping(addr.id)} className={styles.seeAllBtn} style={{ fontSize: 11, padding: '4px 8px' }}>Varsayılan Teslimat Yap</button>
                    )}

                    {addr.isDefaultBilling ? (
                      <span style={{ fontSize: 11, color: '#2ecc71', background: 'rgba(46,204,113,0.1)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FiCheck /> Varsayılan Fatura</span>
                    ) : (
                      <button onClick={() => handleSetDefaultBilling(addr.id)} className={styles.seeAllBtn} style={{ fontSize: 11, padding: '4px 8px' }}>Varsayılan Fatura Yap</button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleOpenEdit(addr)} className={styles.iconBtn} title="Düzenle"><FiEdit3 /></button>
                  <button onClick={() => handleDelete(addr.id)} className={styles.iconBtn} style={{ color: '#e05594' }} title="Sil"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}

          {addresses.length === 0 && (
            <p className={styles.emptyText} style={{ textAlign: 'center', padding: 24 }}>Kayıtlı adresiniz bulunmamaktadır.</p>
          )}
        </div>
      )}
    </div>
  );
}
