const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('../middlewares/auth');
const userDokumenController = require('../controllers/userDokumenController');

// Fitur 14, 16, 17 (Nasywa): Daftar, cari, filter dokumen
router.get('/dokumen', isAuthenticated, userDokumenController.index);

// Fitur 15 (Nasywa): Detail dokumen
router.get('/dokumen/:id', isAuthenticated, userDokumenController.detail);

// Halaman Profil Pengguna
router.get('/profile', isAuthenticated, async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT nim_nip FROM users WHERE id = ?', [req.session.userId]);
        const nim_nip = rows.length > 0 ? rows[0].nim_nip : '-';

        res.render('user/profile', {
            title: 'Profil Saya',
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.userRole,
                nim_nip: nim_nip
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;