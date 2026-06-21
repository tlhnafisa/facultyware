import { test, expect } from '@playwright/test';

test.describe('Manajemen Kategori Dokumen (CRUD)', () => {
  const baseURL = 'http://localhost:3000';
  const categoryName = `Kategori Uji ${Date.now()}`;
  const updatedCategoryName = `${categoryName} Diperbarui`;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('#username', 'admin@fti.ac.id');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);
  });

  test('Berhasil menambah, melihat, mengedit, dan menghapus kategori', async ({ page }) => {
    // 1. Pergi ke halaman kategori
    await page.goto(`${baseURL}/admin/kategori`);
    await expect(page.locator('h1')).toContainText('Kelola Kategori');

    // 2. Tambah kategori baru
    await page.click('text=+ Tambah Kategori');
    await expect(page).toHaveURL(`${baseURL}/admin/kategori/tambah`);
    await page.fill('input[name="name"]', categoryName);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${baseURL}/admin/kategori.*`));

    // Pastikan kategori baru terdaftar di tabel
    await expect(page.locator('table')).toContainText(categoryName);

    // 3. Edit kategori
    // Cari baris kategori baru, lalu klik Edit
    const row = page.locator(`table tbody tr:has-text("${categoryName}")`);
    await row.locator('text=Edit').click();
    await page.fill('input[name="name"]', updatedCategoryName);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${baseURL}/admin/kategori.*`));

    // Pastikan nama terupdate di tabel
    await expect(page.locator('table')).toContainText(updatedCategoryName);

    // 4. Hapus kategori
    // Daftarkan handler dialog konfirmasi hapus browser
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Yakin ingin menghapus kategori ini?');
      await dialog.accept();
    });
    const updatedRow = page.locator(`table tbody tr:has-text("${updatedCategoryName}")`);
    await updatedRow.locator('button:has-text("Hapus")').click();

    // Pastikan muncul alert sukses
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toContainText('Kategori berhasil dihapus');
  });
});
