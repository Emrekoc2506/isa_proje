import { JSDOM } from 'jsdom';

async function validateFeed() {
  console.log('🔍 Validating https://muhristan.com/google-catalog.xml ...\n');
  const res = await fetch('https://muhristan.com/google-catalog.xml');
  console.log('HTTP Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));

  const xml = await res.text();
  console.log('Feed Size:', (xml.length / 1024).toFixed(2), 'KB');

  // XML Parser ile syntax testi
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const parserError = dom.window.document.querySelector('parsererror');
  if (parserError) {
    console.error('❌ XML Syntax Hatası:', parserError.textContent);
    return;
  }
  console.log('✅ XML Syntax Doğrulandı: Hatasız ve geçerli XML!\n');

  const doc = dom.window.document;
  const channel = doc.querySelector('channel');
  console.log('📌 Kanal Başlığı:', channel.querySelector('title')?.textContent);
  console.log('📌 Kanal Linki:', channel.querySelector('link')?.textContent);

  const items = doc.querySelectorAll('item');
  console.log('📦 Toplam Ürün Sayısı:', items.length, '\n');

  const errors = [];
  const warnings = [];
  const ids = new Set();

  items.forEach((item, index) => {
    const getId = item.getElementsByTagName('g:id')[0]?.textContent;
    const getTitle = item.getElementsByTagName('g:title')[0]?.textContent;
    const getDesc = item.getElementsByTagName('g:description')[0]?.textContent;
    const getLink = item.getElementsByTagName('g:link')[0]?.textContent;
    const getImage = item.getElementsByTagName('g:image_link')[0]?.textContent;
    const getAvailability = item.getElementsByTagName('g:availability')[0]?.textContent;
    const getPrice = item.getElementsByTagName('g:price')[0]?.textContent;
    const getSalePrice = item.getElementsByTagName('g:sale_price')[0]?.textContent;
    const getBrand = item.getElementsByTagName('g:brand')[0]?.textContent;
    const getCondition = item.getElementsByTagName('g:condition')[0]?.textContent;
    const getIdentifierExists = item.getElementsByTagName('g:identifier_exists')[0]?.textContent;
    const getGoogleCat = item.getElementsByTagName('g:google_product_category')[0]?.textContent;
    const getShipping = item.getElementsByTagName('g:shipping')[0];

    // Kontroller
    if (!getId) errors.push(`Ürün #${index + 1}: g:id eksik!`);
    else if (ids.has(getId)) errors.push(`Mükerrer ID: ${getId}`);
    else ids.add(getId);

    if (!getTitle) errors.push(`Ürün ${getId}: g:title eksik!`);
    else if (getTitle.length > 150) warnings.push(`Ürün ${getId}: Başlık 150 karakteri aşıyor (${getTitle.length})`);

    if (!getDesc) errors.push(`Ürün ${getId}: g:description eksik!`);
    else {
      if (getDesc.includes('<') || getDesc.includes('>')) warnings.push(`Ürün ${getId}: Açıklamada HTML tag'i olabilir!`);
      if (getDesc.length > 5000) warnings.push(`Ürün ${getId}: Açıklama 5000 karakteri aşıyor!`);
    }

    if (!getLink || !getLink.startsWith('https://muhristan.com/urun/')) errors.push(`Ürün ${getId}: Geçersiz link: ${getLink}`);
    if (!getImage || !getImage.startsWith('http')) errors.push(`Ürün ${getId}: Geçersiz resim linki: ${getImage}`);

    if (!['in_stock', 'out_of_stock', 'preorder', 'backorder'].includes(getAvailability)) {
      errors.push(`Ürün ${getId}: Geçersiz availability: ${getAvailability}`);
    }

    if (!getPrice || !getPrice.endsWith(' TRY')) errors.push(`Ürün ${getId}: Geçersiz fiyat formatı: ${getPrice}`);
    if (getSalePrice && !getSalePrice.endsWith(' TRY')) errors.push(`Ürün ${getId}: Geçersiz indirimli fiyat: ${getSalePrice}`);

    if (!getBrand) warnings.push(`Ürün ${getId}: g:brand eksik`);
    if (getCondition !== 'new') warnings.push(`Ürün ${getId}: Condition 'new' değil: ${getCondition}`);
    if (getIdentifierExists !== 'no' && getIdentifierExists !== 'yes') warnings.push(`Ürün ${getId}: g:identifier_exists no/yes değil`);
    if (!getGoogleCat) warnings.push(`Ürün ${getId}: g:google_product_category eksik`);
    if (!getShipping) warnings.push(`Ürün ${getId}: g:shipping eksik`);
  });

  console.log('=== DOĞRULAMA RAPORU ===');
  console.log('❌ Kritik Hata Sayısı:', errors.length);
  console.log('⚠️  Uyarı Sayısı:', warnings.length);

  if (errors.length > 0) {
    console.log('\nHatalar:');
    errors.forEach(e => console.log(' -', e));
  } else {
    console.log('✅ Hiçbir kritik hata bulunamadı.');
  }

  if (warnings.length > 0) {
    console.log('\nUyarılar:');
    warnings.forEach(w => console.log(' -', w));
  } else {
    console.log('✅ Hiçbir uyarı bulunamadı.');
  }

  // Örnek bir ürünü yazdır
  if (items.length > 0) {
    console.log('\n--- Örnek Doğrulanmış Ürün (İlk Ürün) ---');
    const first = items[0];
    console.log('ID:', first.getElementsByTagName('g:id')[0]?.textContent);
    console.log('Başlık:', first.getElementsByTagName('g:title')[0]?.textContent);
    console.log('Fiyat:', first.getElementsByTagName('g:price')[0]?.textContent);
    console.log('Stok:', first.getElementsByTagName('g:availability')[0]?.textContent);
    console.log('Link:', first.getElementsByTagName('g:link')[0]?.textContent);
    console.log('Resim:', first.getElementsByTagName('g:image_link')[0]?.textContent);
    console.log('Kategori:', first.getElementsByTagName('g:google_product_category')[0]?.textContent);
    console.log('Identifier Exists:', first.getElementsByTagName('g:identifier_exists')[0]?.textContent);
  }
}

validateFeed();
