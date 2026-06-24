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

// ==========================================
// D. Dokumen Publish (User)
// ==========================================
test.describe.serial('D. Dokumen Publish (User)', () => {
  const uniqueId = Date.now();
  const userDocName = `User Dokumen ${uniqueId}`;
  const userDocNo = `USR-DOC-${uniqueId}`;
  let userDocId = '';

  test('TC-22a: Persiapan - Tambah & publish dokumen oleh Admin', async ({ page, context }) => {
    // Login as Admin
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Tambah Dokumen
    await page.goto('http://localhost:3000/admin/dokumen/tambah');
    await page.locator('input[name="name"]').fill(userDocName);
    await page.selectOption('select[name="document_type_id"]', { index: 1 });
    await page.locator('input[name="doc_no"]').fill(userDocNo);
    await page.selectOption('select[name="scope"]', 'Mahasiswa');
    
    // Unggah file
    await page.setInputFiles('input[name="file"]', {
      name: 'dokumen_user.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Konten dokumen untuk user panel.')
    });
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);

    // Cari dokumen untuk mendapatkan ID
    await page.locator('input[name="search"]').fill(userDocName);
    await page.locator('button:has-text("Cari")').click();
    const docRow = page.locator('tr', { hasText: userDocName }).first();
    await docRow.locator('text=Detail').click();
    
    const url = page.url();
    userDocId = url.split('/').pop();

    // Publish dokumen
    await page.locator('button:has-text("Publish")').click();
    await expect(page).toHaveURL(/.*\/admin\/dokumen.*/);
  });

  test('TC-23: Menampilkan daftar dokumen publish', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Pergi ke /dokumen
    await page.goto('http://localhost:3000/dokumen');
    const tableBody = page.locator('table tbody');
    await expect(tableBody).toContainText(userDocName);
  });

  test('TC-24: Melihat detail dokumen publish', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Buka detail
    await page.goto(`http://localhost:3000/dokumen/${userDocId}`);
    await expect(page.locator('main')).toContainText(userDocName);
    await expect(page.locator('main')).toContainText(userDocNo);
  });

  test('TC-25: Mencari dokumen publish', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Cari
    await page.goto('http://localhost:3000/dokumen');
    await page.locator('input[name="search"]').fill(userDocName);
    await page.locator('button:has-text("Cari")').click();

    const tableBody = page.locator('table tbody');
    await expect(tableBody).toContainText(userDocName);
  });

  test('TC-26: Filter dokumen publish berdasarkan kategori', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Filter
    await page.goto('http://localhost:3000/dokumen');
    await page.selectOption('select[name="kategori_id"]', { index: 1 });
    await page.locator('button:has-text("Cari")').click();

    // Verifikasi URL mengandung kategori_id
    await expect(page).toHaveURL(/.*kategori_id=.+/);
  });

  test('TC-27: Download dokumen publish', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Buka detail
    await page.goto(`http://localhost:3000/dokumen/${userDocId}`);

    // Verifikasi tombol unduh ada dan mengarah ke folder uploads
    const downloadLink = page.locator('a:has-text("Unduh")');
    await expect(downloadLink).toBeVisible();
    const href = await downloadLink.getAttribute('href');
    expect(href).toContain('/uploads/');
  });

  test('TC-27a: Pembersihan - Hapus dokumen oleh Admin', async ({ page, context }) => {
    // Login as Admin
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Hapus
    await page.goto('http://localhost:3000/admin/dokumen');
    await page.locator('input[name="search"]').fill(userDocName);
    await page.locator('button:has-text("Cari")').click();
    
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    const docRow = page.locator('tr', { hasText: userDocName }).first();
    await docRow.locator('button:has-text("Hapus")').click();
  });
});

// ==========================================
// E. Export Data (Admin)
// ==========================================
test.describe.serial('E. Export Data (Admin)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Bersihkan semua cookie sesi lama agar form login selalu tampil
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC-28: Export data dokumen ke Excel', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');
    
    // Klik Export Excel dan tunggu download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a:has-text("Export Excel")').click()
    ]);

    expect(download.suggestedFilename()).toContain('.xlsx');
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('TC-29: Export data dokumen ke PDF', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dokumen');

    // Klik Export PDF dan tunggu download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a:has-text("Export PDF")').click()
    ]);

    expect(download.suggestedFilename()).toContain('.pdf');
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('TC-30: Export statistik dokumen', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dashboard');

    // Klik Export Statistik Excel dan tunggu download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a:has-text("Export Statistik Excel")').click()
    ]);

    expect(download.suggestedFilename()).toContain('.xlsx');
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

// ==========================================
// F. REST API JSON
// ==========================================
test.describe.serial('F. REST API JSON', () => {
  test('TC-31: GET kategori dokumen', async ({ page, context }) => {
    // Login as Admin
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Fetch API
    const response = await page.request.get('http://localhost:3000/api/admin/kategori');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('TC-32: POST kategori dokumen', async ({ page, context }) => {
    // Login as Admin
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // POST Kategori via API
    const response = await page.request.post('http://localhost:3000/api/admin/kategori', {
      data: { name: `API Kategori Uji ${Date.now()}` }
    });
    expect(response.status()).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('Kategori berhasil dibuat');
    expect(json.data.id).toBeTruthy();
  });

  test('TC-33: GET daftar dokumen', async ({ page, context }) => {
    // Login as Admin
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('admin@fti.ac.id');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Fetch API
    const response = await page.request.get('http://localhost:3000/api/admin/dokumen');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('TC-34: GET detail dokumen', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Ambil daftar dokumen publik lewat API
    const listRes = await page.request.get('http://localhost:3000/api/dokumen');
    expect(listRes.status()).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);
    
    if (listJson.data.length > 0) {
      const docId = listJson.data[0].id;
      // Get detail lewat API
      const detailRes = await page.request.get(`http://localhost:3000/api/dokumen/${docId}`);
      expect(detailRes.status()).toBe(200);
      const detailJson = await detailRes.json();
      expect(detailJson.success).toBe(true);
      expect(detailJson.data.dokumen).toBeTruthy();
    }
  });

  test('TC-35: Search dokumen API', async ({ page, context }) => {
    // Login as User
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="username"]').fill('2411522007_talitha@gmail.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*home/);

    // Ambil daftar dokumen publik lewat API
    const listRes = await page.request.get('http://localhost:3000/api/dokumen');
    const listJson = await listRes.json();
    
    if (listJson.data.length > 0) {
      const searchName = listJson.data[0].name;
      // Cari lewat API
      const searchRes = await page.request.get(`http://localhost:3000/api/dokumen?search=${encodeURIComponent(searchName)}`);
      expect(searchRes.status()).toBe(200);
      const searchJson = await searchRes.json();
      expect(searchJson.success).toBe(true);
      expect(searchJson.data.length).toBeGreaterThan(0);
      expect(searchJson.data[0].name).toBe(searchName);
    }
  });
});

