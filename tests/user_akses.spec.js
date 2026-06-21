import { test, expect } from '@playwright/test';

test.describe('Akses Pengguna Reguler (Melihat, Mencari, Memfilter & Mengunduh Dokumen)', () => {
  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Login sebagai user biasa
    await page.goto(`${baseURL}/login`);
    await page.fill('#username', '2411522007_talitha@gmail.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/home`);
  });

  test('Pengguna reguler dapat melihat list, detail, mencari, memfilter, dan mengunduh dokumen', async ({ page }) => {
    // 1. Masuk ke halaman daftar dokumen
    await page.goto(`${baseURL}/dokumen`);
    await expect(page.locator('h1')).toContainText('Daftar Dokumen');

    // 2. Melakukan Pencarian Dokumen yang Terpublikasi
    await page.fill('input[name="search"]', 'artikel');
    await page.click('button[type="submit"]');
    await expect(page.locator('table')).toContainText('artikel');

    // 3. Melakukan Filter berdasarkan Kategori
    await page.selectOption('select[name="kategori_id"]', { index: 1 }); // pilih opsi kategori pertama yang tersedia
    await page.click('button[type="submit"]');
    // Pastikan halaman tidak crash
    await expect(page.locator('h1')).toContainText('Daftar Dokumen');

    // Reset filter
    const resetBtn = page.locator('text=Reset');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    }

    // 4. Melihat Detail Dokumen yang Terpublikasi
    // Klik detail pada baris dokumen pertama di tabel
    const docRow = page.locator('table tbody tr').first();
    const docName = await docRow.locator('td').nth(1).innerText();
    await docRow.locator('text=Detail').click();

    // Pastikan berada di halaman detail dokumen
    await expect(page.locator('h1')).toContainText(docName);

    // 5. Mengunduh Dokumen (Verifikasi Tautan Unduh Tersedia)
    const downloadTable = page.locator('table').last();
    const downloadLink = downloadTable.locator('a:has-text("Unduh")').first();
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute('href', /^\/uploads\/.*/);
  });
});
