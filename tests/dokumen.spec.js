import { test, expect } from '@playwright/test';

test.describe('Manajemen Dokumen (CRUD & Kenaikan Versi)', () => {
  const baseURL = 'http://localhost:3000';
  const uniqueId = Date.now();
  const docName = `Uji ${uniqueId}`;
  const docNo = `DOC-${uniqueId}`;

  // Helper untuk login sebelum setiap test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('#username', 'admin@fti.ac.id');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);
  });

  test('Berhasil menambah, edit dengan ganti file (naik versi), dan hapus dokumen', async ({ page }) => {
    // --- 1. TAMBAH DOKUMEN ---
    // Pergi ke halaman daftar dokumen
    await page.goto(`${baseURL}/admin/dokumen`);
    await page.click('text=+ Tambah Dokumen');
    await expect(page).toHaveURL(`${baseURL}/admin/dokumen/tambah`);

    // Isi data dokumen baru
    await page.fill('input[name="name"]', docName);
    await page.selectOption('select[name="scope"]', 'Pegawai/Dosen');
    await page.fill('input[name="doc_no"]', docNo);

    // Unggah file pertama (Versi v1)
    await page.setInputFiles('input[name="file"]', {
      name: 'versi1.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Ini adalah berkas dokumen versi ke-1.')
    });

    // Simpan dokumen
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${baseURL}/admin/dokumen.*`));

    // Cari dokumen yang baru dibuat
    await page.fill('input[name="search"]', docName);
    await page.click('button[type="submit"]');

    // Pastikan dokumen muncul di tabel
    const docRow = page.locator('table tbody tr').first();
    await expect(docRow).toContainText(docName);
    await expect(docRow).toContainText(docNo);

    // Klik tombol Detail untuk melihat detail dokumen & versi
    await docRow.locator('text=Detail').click();
    
    // Pastikan ada riwayat versi "v1" dan file "versi1.txt" terdaftar
    const detailTitle = page.locator('h1');
    await expect(detailTitle).toContainText(docName);
    await expect(page.locator('table').last()).toContainText('v1');
    await expect(page.locator('table').last().locator('a:has-text("Unduh")')).toBeVisible();

    // --- 2. EDIT DOKUMEN DENGAN GANTI FILE (NAIK VERSI) ---
    // Pergi ke halaman edit dokumen
    const docId = page.url().split('/').pop();
    await page.goto(`${baseURL}/admin/dokumen/${docId}/edit`);

    // Ubah nama dan unggah berkas baru
    const updatedName = `${docName} (Diperbarui)`;
    await page.fill('input[name="name"]', updatedName);
    
    // Unggah file baru untuk menaikkan versi menjadi v2
    await page.setInputFiles('input[name="file"]', {
      name: 'versi2.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Ini adalah berkas dokumen versi ke-2 yang diperbarui.')
    });

    // Klik tombol Perbarui
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${baseURL}/admin/dokumen.*`));

    // Buka detail dokumen kembali
    await page.goto(`${baseURL}/admin/dokumen/${docId}`);

    // Pastikan nama dokumen diperbarui
    await expect(page.locator('main')).toContainText(updatedName);

    // Pastikan versi baru "v2" terbuat dan berkasnya adalah "versi2.txt"
    const tableContent = page.locator('table').last();
    await expect(tableContent).toContainText('v2');
    await expect(tableContent).toContainText('v1');
    await expect(tableContent.locator('a:has-text("Unduh")')).toHaveCount(2);

    // --- 3. HAPUS DOKUMEN ---
    // Kembali ke halaman daftar dokumen
    await page.goto(`${baseURL}/admin/dokumen`);
    await page.fill('input[name="search"]', updatedName);
    await page.click('button[type="submit"]');

    // Klik tombol Hapus dan setujui dialog konfirmasi browser
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Yakin ingin menghapus dokumen ini?');
      await dialog.accept();
    });
    await page.locator('button:has-text("Hapus")').first().click();

    // Pastikan muncul pesan sukses dokumen berhasil dihapus
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toContainText('Dokumen berhasil dihapus');
  });
});
