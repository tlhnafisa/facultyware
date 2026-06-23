const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const apiController = require('../controllers/apiController');

// API Kategori (Admin)
router.get('/api/admin/kategori', isAuthenticated, apiController.adminKategori);
router.post('/api/admin/kategori', isAuthenticated, apiController.createKategori);

// API Dokumen (Admin)
router.get('/api/admin/dokumen', isAuthenticated, apiController.adminDokumen);

// API Dokumen Terpublikasi & Pencarian (User)
router.get('/api/dokumen', isAuthenticated, apiController.userDokumen);

// API Detail Dokumen Terpublikasi (User)
router.get('/api/dokumen/:id', isAuthenticated, apiController.userDokumenDetail);

module.exports = router;
