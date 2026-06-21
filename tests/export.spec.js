import { test, expect } from '@playwright/test';

test.describe('Ekspor Data Dokumen & Laporan (Admin)', () => {
  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('#username', 'admin@fti.ac.id');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);
  });

  test('Berhasil mendownload berkas ekspor Excel, PDF, dan Statistik', async ({ page }) => {
    // 1. Ekspor Daftar Dokumen (Excel)
    await page.goto(`${baseURL}/admin/dokumen`);
    const [downloadExcel] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Export Excel')
    ]);
    expect(downloadExcel.suggestedFilename()).toContain('.xlsx');

    // 2. Ekspor Daftar Dokumen (PDF)
    const [downloadPdf] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Export PDF')
    ]);
    expect(downloadPdf.suggestedFilename()).toContain('.pdf');

    // 3. Ekspor Laporan Statistik Dokumen (Excel)
    await page.goto(`${baseURL}/admin/dashboard`);
    const [downloadStat] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Export Statistik Excel')
    ]);
    expect(downloadStat.suggestedFilename()).toContain('.xlsx');
  });
});
