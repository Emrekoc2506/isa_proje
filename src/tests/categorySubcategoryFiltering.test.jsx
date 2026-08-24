import { describe, it, expect } from 'vitest';

describe('Category & Subcategory Filtering Logic', () => {
  const toSlug = (str) =>
    String(str || "")
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const categories = [
    {
      id: 'cat_kolye_1',
      databaseId: 'guid-kolye',
      name: 'KOLYE',
      label: 'KOLYE',
      slug: 'kolye',
      children: [
        { id: 'sub_bakir', databaseId: 'guid-bakir', name: 'BAKIR KOLYELER', label: 'BAKIR KOLYELER', slug: 'bakir-kolyeler' },
        { id: 'sub_celik', databaseId: 'guid-celik', name: 'ÇELİK KOLYELER', label: 'ÇELİK KOLYELER', slug: 'celik-kolyeler' },
        { id: 'sub_dogaltas', databaseId: 'guid-dogaltas', name: 'DOĞAL TAŞLI KOLYELER', label: 'DOĞAL TAŞLI KOLYELER', slug: 'dogal-tasli-kolyeler' },
        { id: 'sub_gumus', databaseId: 'guid-gumus', name: 'GÜMÜŞ KOLYELER', label: 'GÜMÜŞ KOLYELER', slug: 'gumus-kolyeler' },
      ]
    },
    {
      id: 'cat_yuzuk_2',
      databaseId: 'guid-yuzuk',
      name: 'YÜZÜK',
      label: 'YÜZÜK',
      slug: 'yuzuk',
      children: [
        { id: 'sub_gumus_yuzuk', databaseId: 'guid-gumus-yuzuk', name: 'GÜMÜŞ YÜZÜKLER', label: 'GÜMÜŞ YÜZÜKLER', slug: 'gumus-yuzukler' }
      ]
    }
  ];

  const isProductInCategory = (product, targetCat, catList) => {
    if (!targetCat || targetCat === "hepsi") {
      return true;
    }
    const targetStr = String(targetCat).toLowerCase().trim();
    const targetSlug = toSlug(targetCat);

    const matchedCats = (catList || categories).filter((c) =>
      String(c.id).toLowerCase() === targetStr ||
      String(c.databaseId || "").toLowerCase() === targetStr ||
      String(c.slug || "").toLowerCase() === targetStr ||
      String(c.name || "").toLowerCase() === targetStr ||
      String(c.label || "").toLowerCase() === targetStr ||
      toSlug(c.slug || c.name || c.label) === targetSlug
    );

    const validKeys = new Set();
    if (targetStr) validKeys.add(targetStr);
    if (targetSlug) validKeys.add(targetSlug);

    matchedCats.forEach((c) => {
      if (c.id) validKeys.add(String(c.id).toLowerCase().trim());
      if (c.databaseId) validKeys.add(String(c.databaseId).toLowerCase().trim());
      if (c.slug) validKeys.add(String(c.slug).toLowerCase().trim());
      if (c.name) validKeys.add(String(c.name).toLowerCase().trim());
      if (c.label) validKeys.add(String(c.label).toLowerCase().trim());
      const s = toSlug(c.slug || c.name || c.label);
      if (s) validKeys.add(s);

      if (Array.isArray(c.children)) {
        c.children.forEach((sub) => {
          if (sub.id) validKeys.add(String(sub.id).toLowerCase().trim());
          if (sub.databaseId) validKeys.add(String(sub.databaseId).toLowerCase().trim());
          if (sub.slug) validKeys.add(String(sub.slug).toLowerCase().trim());
          if (sub.name) validKeys.add(String(sub.name).toLowerCase().trim());
          if (sub.label) validKeys.add(String(sub.label).toLowerCase().trim());
          const subS = toSlug(sub.slug || sub.name || sub.label);
          if (subS) validKeys.add(subS);
        });
      }
    });
    validKeys.delete("");

    const pCatId = String(product.categoryId || "").toLowerCase().trim();
    const pSubCatId = String(product.subcategoryId || "").toLowerCase().trim();
    const pCatName = String(product.categoryName || product.category || "").toLowerCase().trim();
    const pSubCatName = String(product.subcategory || product.subCategory || "").toLowerCase().trim();

    return (
      (Boolean(pCatId) && validKeys.has(pCatId)) ||
      (Boolean(pSubCatId) && validKeys.has(pSubCatId)) ||
      (Boolean(pCatName) && validKeys.has(pCatName)) ||
      (Boolean(pSubCatName) && validKeys.has(pSubCatName)) ||
      (Boolean(pCatName) && validKeys.has(toSlug(pCatName))) ||
      (Boolean(pSubCatName) && validKeys.has(toSlug(pSubCatName)))
    );
  };

  const isProductInSubcategory = (product, targetSub) => {
    if (!targetSub || targetSub === "hepsi") return true;

    const targetStr = String(targetSub).toLowerCase().trim();
    const targetSlug = toSlug(targetSub);

    const targetKeys = new Set();
    if (targetStr) targetKeys.add(targetStr);
    if (targetSlug) targetKeys.add(targetSlug);

    for (const cat of categories) {
      if (Array.isArray(cat.children)) {
        for (const sub of cat.children) {
          const subAliases = new Set();
          if (sub.id) subAliases.add(String(sub.id).toLowerCase().trim());
          if (sub.databaseId) subAliases.add(String(sub.databaseId).toLowerCase().trim());
          if (sub.slug) subAliases.add(String(sub.slug).toLowerCase().trim());
          if (sub.name) subAliases.add(String(sub.name).toLowerCase().trim());
          if (sub.label) subAliases.add(String(sub.label).toLowerCase().trim());
          const subSlug = toSlug(sub.slug || sub.name || sub.label);
          if (subSlug) subAliases.add(subSlug);
          subAliases.delete("");

          const isMatch = Array.from(subAliases).some((alias) => targetKeys.has(alias));
          if (isMatch) {
            subAliases.forEach((alias) => targetKeys.add(alias));
          }
        }
      }
    }
    targetKeys.delete("");

    const productSubKeys = new Set();

    const pSubCatId = String(product.subcategoryId || "").toLowerCase().trim();
    if (pSubCatId) productSubKeys.add(pSubCatId);

    const pSubCatName = String(product.subcategory || product.subCategory || "").toLowerCase().trim();
    if (pSubCatName) {
      productSubKeys.add(pSubCatName);
      const s = toSlug(pSubCatName);
      if (s) productSubKeys.add(s);
    }

    const pCatId = String(product.categoryId || "").toLowerCase().trim();
    if (pCatId) productSubKeys.add(pCatId);

    const pCatName = String(product.categoryName || product.category || "").toLowerCase().trim();
    if (pCatName) {
      productSubKeys.add(pCatName);
      const s = toSlug(pCatName);
      if (s) productSubKeys.add(s);
    }

    productSubKeys.delete("");

    for (const key of productSubKeys) {
      if (targetKeys.has(key)) {
        return true;
      }
    }

    return false;
  };

  const sampleProducts = [
    // 1. Ürün: Alt kategorisi yok, sadece ana kategori KOLYE
    { id: 1, name: 'Sade Kolye', categoryId: 'cat_kolye_1', categoryName: 'KOLYE' },
    // 2. Ürün: Alt kategori BAKIR KOLYELER
    { id: 2, name: 'Bakır Kolye 1', categoryId: 'sub_bakir', categoryName: 'BAKIR KOLYELER' },
    // 3. Ürün: Alt kategori BAKIR KOLYELER (subcategoryId alanı ile)
    { id: 3, name: 'Bakır Kolye 2', categoryId: 'cat_kolye_1', subcategoryId: 'sub_bakir', subcategory: 'BAKIR KOLYELER' },
    // 4. Ürün: Alt kategori DOĞAL TAŞLI KOLYELER
    { id: 4, name: 'Ametist Doğal Taş Kolye', categoryId: 'sub_dogaltas', categoryName: 'DOĞAL TAŞLI KOLYELER' },
    // 5. Ürün: Alt kategori ÇELİK KOLYELER
    { id: 5, name: 'Çelik Kolye', categoryId: 'sub_celik', categoryName: 'ÇELİK KOLYELER' },
  ];

  it('1. Alt kategorisi olmayan ürünler tüm alt kategorilerde görünmez, sadece Tüm Alt Kategorilerde görünür', () => {
    const unassignedProduct = sampleProducts[0];

    expect(isProductInCategory(unassignedProduct, 'cat_kolye_1', categories)).toBe(true);
    expect(isProductInSubcategory(unassignedProduct, '')).toBe(true); // Tüm alt kategoriler

    // Alt kategori filtrelerinde çıkmamalı
    expect(isProductInSubcategory(unassignedProduct, 'BAKIR KOLYELER')).toBe(false);
    expect(isProductInSubcategory(unassignedProduct, 'ÇELİK KOLYELER')).toBe(false);
    expect(isProductInSubcategory(unassignedProduct, 'DOĞAL TAŞLI KOLYELER')).toBe(false);
    expect(isProductInSubcategory(unassignedProduct, 'GÜMÜŞ KOLYELER')).toBe(false);
  });

  it('2. Bakır Kolye alt kategorisi seçildiğinde sadece Bakır Kolye olan ürünler gelir', () => {
    const bakirProducts = sampleProducts.filter(
      p => isProductInCategory(p, 'cat_kolye_1', categories) && isProductInSubcategory(p, 'BAKIR KOLYELER')
    );

    expect(bakirProducts.length).toBe(2);
    expect(bakirProducts.map(p => p.id)).toEqual([2, 3]);
  });

  it('3. Doğal Taşlı Kolyeler seçildiğinde sadece Doğal Taşlı kolye gelir', () => {
    const dogaltasProducts = sampleProducts.filter(
      p => isProductInCategory(p, 'cat_kolye_1', categories) && isProductInSubcategory(p, 'DOĞAL TAŞLI KOLYELER')
    );

    expect(dogaltasProducts.length).toBe(1);
    expect(dogaltasProducts[0].id).toBe(4);
  });

  it('4. Alt kategori ürün sayıları her alt kategori için 22 (toplam) yerine gerçek sayısını gösterir', () => {
    const subList = categories[0].children;

    const counts = subList.map(sub => ({
      name: sub.name,
      count: sampleProducts.filter(
        p => isProductInCategory(p, 'cat_kolye_1', categories) && isProductInSubcategory(p, sub.id || sub.name)
      ).length
    }));

    expect(counts).toEqual([
      { name: 'BAKIR KOLYELER', count: 2 },
      { name: 'ÇELİK KOLYELER', count: 1 },
      { name: 'DOĞAL TAŞLI KOLYELER', count: 1 },
      { name: 'GÜMÜŞ KOLYELER', count: 0 },
    ]);
  });
});
