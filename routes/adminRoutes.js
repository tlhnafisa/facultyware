const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const kategoriController = require('../controllers/kategoriController');
const dokumenController = require('../controllers/dokumenController');
const exportController = require('../controllers/exportController');
const usersController = require('../controllers/usersController');

// Konfigurasi upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Kategori
router.get('/admin/kategori', isAuthenticated, kategoriController.index);
router.get('/admin/kategori/tambah', isAuthenticated, kategoriController.tambahForm);
router.post('/admin/kategori/tambah', isAuthenticated, kategoriController.tambah);
router.get('/admin/kategori/edit/:id', isAuthenticated, kategoriController.editForm);
router.post('/admin/kategori/edit/:id', isAuthenticated, kategoriController.edit);
router.post('/admin/kategori/hapus/:id', isAuthenticated, kategoriController.hapus);

// Dokumen
router.get('/admin/dokumen', isAuthenticated, dokumenController.index);
router.get('/admin/dokumen/tambah', isAuthenticated, dokumenController.tambahForm);
router.post('/admin/dokumen/tambah', isAuthenticated, upload.single('file'), dokumenController.tambah);
router.get('/admin/dokumen/:id', isAuthenticated, dokumenController.detail);
router.get('/admin/dokumen/:id/edit', isAuthenticated, dokumenController.editForm);
router.post('/admin/dokumen/:id/edit', isAuthenticated, upload.single('file'), dokumenController.edit);
router.post('/admin/dokumen/:id/publish', isAuthenticated, dokumenController.togglePublish);
router.post('/admin/dokumen/:id/versi', isAuthenticated, upload.single('file'), dokumenController.uploadVersi);
router.post('/admin/dokumen/:id/hapus', isAuthenticated, dokumenController.hapus);

// Export Data (Talitha)
router.get('/admin/export/excel', isAuthenticated, exportController.exportDokumenExcel);
router.get('/admin/export/pdf', isAuthenticated, exportController.exportDokumenPdf);
router.get('/admin/export/statistik', isAuthenticated, exportController.exportStatistikExcel);

// Pengguna (Admin)
router.get('/admin/pengguna', isAuthenticated, usersController.list);
router.get('/admin/pengguna/tambah', isAuthenticated, usersController.tambahForm);
router.post('/admin/pengguna/tambah', isAuthenticated, usersController.tambah);
router.get('/admin/pengguna/edit/:id', isAuthenticated, usersController.editForm);
router.post('/admin/pengguna/edit/:id', isAuthenticated, usersController.edit);
router.post('/admin/pengguna/hapus/:id', isAuthenticated, usersController.hapus);

module.exports = router;