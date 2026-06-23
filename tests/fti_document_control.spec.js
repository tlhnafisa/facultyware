const { test, expect } = require('@playwright/test');

// ==========================================
// A. Pengelolaan Kategori Dokumen
// ==========================================
test.describe.serial('A. Pengelolaan Kategori Dokumen', () => {
  const categoryName = `Kategori Uji ${Date.now()}`;
  const updatedCategoryName = `${categoryName} Diperbarui`;

  test.beforeEach(async ({ page, context }) => {
    // Bersihkan semua cookie sesi lama agar form login selalu tampil
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC-01: Menambahkan kategori baru', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/kategori/tambah');
    await page.locator('input[name="name"]').fill(categoryName);
    await page.locator('button[type="submit"]').click();
    
    // Verifikasi kembali ke halaman list kategori (menggunakan regex agar parameter sukses diabaikan)
    await expect(page).toHaveURL(/.*\/admin\/kategori.*/);
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/kategori berhasil/i);
    
    const tableBody = page.locator('table tbody');
    await expect(tableBody).toContainText(categoryName);
  });

  test('TC-02: Menambahkan kategori dengan nama kosong', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/kategori/tambah');
    await page.$eval('input[name="name"]', el => el.removeAttribute('required'));
    await page.locator('input[name="name"]').fill('');
    await page.locator('button[type="submit"]').click();
    
    const errorAlert = page.locator('.alert-danger-custom');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Nama kategori tidak boleh kosong!');
  });

  test('TC-03: Mengubah kategori', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/kategori');
    const categoryRow = page.locator('tr', { hasText: categoryName });
    await expect(categoryRow).toBeVisible();
    await categoryRow.locator('text=Edit').click();
    
    await expect(page).toHaveURL(/.*edit.*/);
    await page.locator('input[name="name"]').fill(updatedCategoryName);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/.*\/admin\/kategori.*/);
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/kategori berhasil/i);
    
    const tableBody = page.locator('table tbody');
    await expect(tableBody).toContainText(updatedCategoryName);
  });

  test('TC-04: Menghapus kategori', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/kategori');
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Yakin ingin menghapus kategori ini?');
      await dialog.accept();
    });

    const categoryRow = page.locator('tr', { hasText: updatedCategoryName });
    await expect(categoryRow).toBeVisible();
    await categoryRow.locator('button:has-text("Hapus")').click();
    
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/kategori berhasil/i);
    
    const tableBody = page.locator('table tbody');
    await expect(tableBody).not.toContainText(updatedCategoryName);
  });
});

// ==========================================
// B. Pengelolaan Dokumen
// ==========================================
test.describe.serial('B. Pengelolaan Dokumen', () => {
  const uniqueId = Date.now();
  const docName = `Uji Dokumen ${uniqueId}`;
  const docNo = `DOC-UJI-${uniqueId}`;
  const updatedDocName = `${docName} Diperbarui`;
  let documentId = '';

  test.beforeEach(async ({ page, context }) => {
    // Bersihkan semua cookie sesi lama agar form login selalu tampil
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC-05: Menambahkan dokumen baru dengan data valid', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen/tambah');
    await page.locator('input[name="name"]').fill(docName);
    await page.selectOption('select[name="document_type_id"]', { index: 1 }); // Pilih kategori pertama
    await page.locator('input[name="doc_no"]').fill(docNo);
    await page.selectOption('select[name="scope"]', 'Mahasiswa');
    
    // Unggah file v1
    await page.setInputFiles('input[name="file"]', {
      name: 'versi1.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Berkas dokumen FTI versi v1.')
    });

    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);
    
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Dokumen berhasil ditambahkan');
  });

  test('TC-06: Menambahkan dokumen tanpa file', async ({ page }) => {
    // Sesuai fungsionalitas aplikasi, file sifatnya opsional sehingga dokumen tetap berhasil disimpan
    await page.goto('http://localhost:3000/admin/dokumen/tambah');
    await page.locator('input[name="name"]').fill(`Dokumen Tanpa File ${uniqueId}`);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Dokumen berhasil ditambahkan');
  });

  test('TC-07: Menambahkan dokumen tanpa judul', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen/tambah');
    await page.$eval('input[name="name"]', el => el.removeAttribute('required'));
    await page.locator('input[name="name"]').fill('');
    await page.locator('button[type="submit"]').click();
    
    const errorAlert = page.locator('.alert-danger-custom');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Nama dokumen tidak boleh kosong!');
  });

  test('TC-08: Menampilkan daftar dokumen', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = page.locator('table tbody tr');
    await expect(rows).not.toHaveCount(0);
  });

  test('TC-09: Melihat detail dokumen', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');
    await page.locator('input[name="search"]').fill(docName);
    await page.locator('button:has-text("Cari")').click();
    
    const docRow = page.locator('tr', { hasText: docName }).first();
    await docRow.locator('text=Detail').click();
    
    // Simpan ID dokumen dari URL untuk digunakan pada test selanjutnya
    const url = page.url();
    documentId = url.split('/').pop();
    
    await expect(page.locator('main')).toContainText(docName);
  });

  test('TC-10: Mengubah informasi dokumen', async ({ page }) => {
    // Pergi ke halaman edit menggunakan ID dokumen yang didapat sebelumnya
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}/edit`);
    await page.locator('input[name="name"]').fill(updatedDocName);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Dokumen berhasil diupdate');
  });

  test('TC-12: Mencari dokumen berdasarkan judul', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');
    await page.locator('input[name="search"]').fill(updatedDocName);
    await page.locator('button:has-text("Cari")').click();
    
    const tableBody = page.locator('table tbody');
    await expect(tableBody).toContainText(updatedDocName);
  });

  test('TC-13: Mencari dokumen yang tidak ada', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');
    await page.locator('input[name="search"]').fill('DokumenAsalAsal12345');
    await page.locator('button:has-text("Cari")').click();
    
    const tableBody = page.locator('table tbody');
    await expect(tableBody).toContainText('Belum ada dokumen');
  });

  test('TC-14: Filter dokumen berdasarkan kategori (User Panel)', async ({ page }) => {
    // Logout admin dan login sebagai user untuk menguji filter dokumen
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    
    await page.goto('http://localhost:3000/dokumen');
    await page.selectOption('select[name="kategori_id"]', { index: 1 });
    await page.locator('button:has-text("Cari")').click();
    
    // Verifikasi url ter-filter
    await expect(page).toHaveURL(/.*kategori_id=.+/);
  });

  test('TC-15: Mengunggah versi baru dokumen', async ({ page }) => {
    // Masuk kembali sebagai admin
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();

    // Buka detail dokumen
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}`);
    
    // Unggah file v2
    await page.setInputFiles('input[type="file"][name="file"]', {
      name: 'versi2.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Berkas dokumen FTI versi v2 (Revisi).')
    });
    
    await page.locator('button:has-text("Unggah Versi Baru")').click();
    
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Versi baru berhasil diunggah');
  });

  test('TC-16: Melihat riwayat versi dokumen', async ({ page }) => {
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}`);
    const versionTable = page.locator('table').last();
    // Verifikasi riwayat versi menampilkan v2 dan v1
    await expect(versionTable).toContainText('v2');
    await expect(versionTable).toContainText('v1');
  });

  test('TC-17: Publish dokumen', async ({ page }) => {
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}`);
    
    // Pastikan status awal adalah Draft, lalu klik Publish
    const statusRow = page.locator('table').first().locator('tr', { hasText: 'Status' });
    await expect(statusRow).toContainText('Draft');
    
    await page.locator('button:has-text("Publish")').click();
    
    // Status berubah menjadi Publish (Terjadi redirect ke list page)
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Dokumen berhasil dipublikasikan');

    // Navigasi kembali ke detail untuk memastikan status terupdate
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}`);
    const statusRowAfter = page.locator('table').first().locator('tr', { hasText: 'Status' });
    await expect(statusRowAfter).toContainText('Publish');
  });

  test('TC-18: Unpublish dokumen', async ({ page }) => {
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}`);
    
    // Pastikan status saat ini adalah Publish, lalu klik Nonaktifkan
    const statusRow = page.locator('table').first().locator('tr', { hasText: 'Status' });
    await expect(statusRow).toContainText('Publish');
    
    await page.locator('button:has-text("Nonaktifkan")').click();
    
    // Status kembali menjadi Draft (Terjadi redirect ke list page)
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Dokumen berhasil dinonaktifkan');

    // Navigasi kembali ke detail untuk memastikan status terupdate
    await page.goto(`http://localhost:3000/admin/dokumen/${documentId}`);
    const statusRowAfter = page.locator('table').first().locator('tr', { hasText: 'Status' });
    await expect(statusRowAfter).toContainText('Draft');
  });

  test('TC-11: Menghapus dokumen', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');
    await page.locator('input[name="search"]').fill(updatedDocName);
    await page.locator('button:has-text("Cari")').click();
    
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Yakin ingin menghapus dokumen ini?');
      await dialog.accept();
    });

    const docRow = page.locator('tr', { hasText: updatedDocName }).first();
    await docRow.locator('button:has-text("Hapus")').click();
    
    const successAlert = page.locator('.alert-success-custom');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Dokumen berhasil dihapus');
  });
});

// ==========================================
// C. Pengelolaan User
// ==========================================
test.describe.serial('C. Pengelolaan User', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('TC-19: Login dengan akun valid', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC-20: Login dengan password salah', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('salah_password');
    await page.locator('button[type="submit"]').click();
    
    // Tetap di halaman login dan ada error alert
    await expect(page).toHaveURL(/.*login/);
    const errorAlert = page.locator('.bg-destructive\\/15, .alert-danger-custom');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/salah/i);
  });

  test('TC-21: Logout sistem', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await page.goto('http://localhost:3000/logout');
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-22: Akses halaman admin tanpa login', async ({ page }) => {
    // Navigasi langsung ke dashboard admin tanpa login
    await page.goto('http://localhost:3000/admin/dashboard');
    
    // Dialihkan kembali ke login
    await expect(page).toHaveURL(/.*login/);
  });
});
