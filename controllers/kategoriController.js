const db = require('../lib/db');

// Tampilkan semua kategori
const index = async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM document_types ORDER BY created_at DESC');
        res.render('admin/kategori/index', {
            title: 'Kelola Kategori',
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.userRole
            },
            kategori,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        next(err);
    }
};

// Tampilkan form tambah
const tambahForm = (req, res) => {
    res.render('admin/kategori/tambah', {
        title: 'Tambah Kategori',
        user: {
            id: req.session.userId,
            name: req.session.userName,
            email: req.session.userEmail,
            role: req.session.userRole
        },
        error: null
    });
};

// Proses tambah kategori
// Proses tambah kategori
const tambah = async (req, res, next) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.render('admin/kategori/tambah', {
            title: 'Tambah Kategori',
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.userRole
            },
            error: 'Nama kategori tidak boleh kosong!'
        });
    }

    try {
        const [lastId] = await db.query('SELECT MAX(id) as maxId FROM document_types');
        const newId = (lastId[0].maxId || 0) + 1;

        await db.query(
            'INSERT INTO document_types (id, name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
            [newId, name.trim()]
        );
        res.redirect('/admin/kategori?success=Kategori berhasil ditambahkan');
    } catch (err) {
        next(err);
    }
};

// Tampilkan form edit
const editForm = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM document_types WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.redirect('/admin/kategori?error=Kategori tidak ditemukan');
        }

        res.render('admin/kategori/edit', {
            title: 'Edit Kategori',
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.userRole
            },
            kategori: rows[0],
            error: null
        });
    } catch (err) {
        next(err);
    }
};

// Proses edit kategori
const edit = async (req, res, next) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        const [rows] = await db.query('SELECT * FROM document_types WHERE id = ?', [req.params.id]);
        return res.render('admin/kategori/edit', {
            title: 'Edit Kategori',
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.userRole
            },
            kategori: rows[0],
            error: 'Nama kategori tidak boleh kosong!'
        });
    }

    try {
        await db.query(
            'UPDATE document_types SET name = ?, updated_at = NOW() WHERE id = ?',
            [name.trim(), req.params.id]
        );
        res.redirect('/admin/kategori?success=Kategori berhasil diupdate');
    } catch (err) {
        next(err);
    }
};

// Hapus kategori
const hapus = async (req, res, next) => {
    try {
        await db.query('DELETE FROM document_types WHERE id = ?', [req.params.id]);
        res.redirect('/admin/kategori?success=Kategori berhasil dihapus');
    } catch (err) {
        next(err);
    }
};

module.exports = { index, tambahForm, tambah, editForm, edit, hapus };