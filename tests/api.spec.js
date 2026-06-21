import { test, expect } from '@playwright/test';

test.describe('RESTful API JSON Endpoints (Fitur 22 - 26)', () => {
  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Login via UI untuk menyimpan session cookie admin di browser context
    await page.goto(`${baseURL}/login`);
    await page.fill('#username', 'admin@fti.ac.id');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);
  });

  test('Berhasil mengakses seluruh endpoint RESTful API JSON', async ({ page }) => {
    // 1. API Kategori (Admin) - Fitur 22
    const resKategori = await page.request.get(`${baseURL}/api/admin/kategori`);
    expect(resKategori.ok()).toBeTruthy();
    const jsonKategori = await resKategori.json();
    expect(jsonKategori.success).toBe(true);
    expect(Array.isArray(jsonKategori.data)).toBe(true);

    // 2. API Dokumen (Admin) - Fitur 23
    const resDokumenAdmin = await page.request.get(`${baseURL}/api/admin/dokumen`);
    expect(resDokumenAdmin.ok()).toBeTruthy();
    const jsonDokumenAdmin = await resDokumenAdmin.json();
    expect(jsonDokumenAdmin.success).toBe(true);
    expect(Array.isArray(jsonDokumenAdmin.data)).toBe(true);

    // 3. API Dokumen Terpublikasi (User) - Fitur 24
    const resDokumenUser = await page.request.get(`${baseURL}/api/dokumen`);
    expect(resDokumenUser.ok()).toBeTruthy();
    const jsonDokumenUser = await resDokumenUser.json();
    expect(jsonDokumenUser.success).toBe(true);
    expect(Array.isArray(jsonDokumenUser.data)).toBe(true);

    // 4. API Pencarian Dokumen Terpublikasi (User) - Fitur 26
    const resSearch = await page.request.get(`${baseURL}/api/dokumen?search=artikel`);
    expect(resSearch.ok()).toBeTruthy();
    const jsonSearch = await resSearch.json();
    expect(jsonSearch.success).toBe(true);
    expect(Array.isArray(jsonSearch.data)).toBe(true);

    // 5. API Detail Dokumen Terpublikasi (User) - Fitur 25
    if (jsonDokumenUser.data.length > 0) {
      const activeDocId = jsonDokumenUser.data[0].id;
      const resDetail = await page.request.get(`${baseURL}/api/dokumen/${activeDocId}`);
      expect(resDetail.ok()).toBeTruthy();
      const jsonDetail = await resDetail.json();
      expect(jsonDetail.success).toBe(true);
      expect(jsonDetail.data.dokumen).toBeDefined();
      expect(Array.isArray(jsonDetail.data.revisi)).toBe(true);
    }
  });
});
