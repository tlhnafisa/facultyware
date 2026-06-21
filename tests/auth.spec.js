import { test, expect } from '@playwright/test';

test.describe('Autentikasi (Login & Logout)', () => {
  const baseURL = 'http://localhost:3000';

  test('Gagal masuk dengan kredensial salah', async ({ page }) => {
    // 1. Buka halaman login
    await page.goto(`${baseURL}/login`);

    // 2. Isi form dengan data asal
    await page.fill('#username', 'salah@fti.ac.id');
    await page.fill('#password', 'salah_password');

    // 3. Klik tombol Masuk
    await page.click('button[type="submit"]');

    // 4. Pastikan ada pesan kesalahan (alert)
    const errorAlert = page.locator('.text-destructive');
    await expect(errorAlert).toBeVisible();
  });

  test('Berhasil masuk sebagai Admin', async ({ page }) => {
    // 1. Buka halaman login
    await page.goto(`${baseURL}/login`);

    // 2. Isi form dengan data admin yang valid
    await page.fill('#username', 'admin@fti.ac.id');
    await page.fill('#password', 'password');

    // 3. Klik tombol Masuk
    await page.click('button[type="submit"]');

    // 4. Pastikan diarahkan ke dashboard admin
    await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);

    // 5. Pastikan tulisan header dashboard menggunakan bahasa Indonesia ("Beranda")
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toContainText('Beranda');
  });

  test('Berhasil masuk sebagai Pengguna Biasa', async ({ page }) => {
    // 1. Buka halaman login
    await page.goto(`${baseURL}/login`);

    // 2. Isi form dengan data user
    await page.fill('#username', '2411522007_talitha@gmail.com');
    await page.fill('#password', 'password');

    // 3. Klik tombol Masuk
    await page.click('button[type="submit"]');

    // 4. Pastikan diarahkan ke home/dashboard user
    await expect(page).toHaveURL(`${baseURL}/home`);

    // 5. Pastikan tulisan header dashboard user menggunakan bahasa Indonesia ("Beranda")
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toContainText('Beranda');
  });
});
