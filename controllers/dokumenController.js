const db = require('../lib/db');
const path = require('path');
const fs = require('fs');

// Tampilkan semua dokumen
const index = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT d.*, dt.name as kategori_name, u.name as created_by_name
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        if (search && search.trim() !== '') {
            query += ' AND d.name LIKE ?';
            params.push(`%${search.trim()}%`);
        }
        query += ' ORDER BY d.created_at DESC';

        const [dokumen] = await db.query(query, params);
        const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
        res.render('admin/dokumen/index', {
            title: 'Kelola Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            dokumen,
            kategori,
            search: search || '',
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) { next(err); }
};

// Tampilkan detail dokumen
const detail = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT d.*, dt.name as kategori_name, u.name as created_by_name
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            WHERE d.id = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.redirect('/admin/dokumen?error=Dokumen tidak ditemukan');

        const [revisi] = await db.query(
            'SELECT * FROM document_revisions WHERE document_id = ? ORDER BY rev_no DESC',
            [req.params.id]
        );

        res.render('admin/dokumen/detail', {
            title: 'Detail Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            dokumen: rows[0],
            revisi,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) { next(err); }
};

// Tampilkan form tambah
const tambahForm = async (req, res, next) => {
    try {
        const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
        res.render('admin/dokumen/tambah', {
            title: 'Tambah Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            kategori,
            error: null
        });
    } catch (err) { next(err); }
};

// Proses tambah dokumen
const tambah = async (req, res, next) => {
    const { name, document_type_id, doc_no, scope } = req.body;

    if (!name || name.trim() === '') {
        const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
        return res.render('admin/dokumen/tambah', {
            title: 'Tambah Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            kategori,
            error: 'Nama dokumen tidak boleh kosong!'
        });
    }

    try {
        if (doc_no && doc_no.trim() !== '') {
            const [existing] = await db.query('SELECT * FROM documents WHERE doc_no = ?', [doc_no.trim()]);
            if (existing.length > 0) {
                const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
                return res.render('admin/dokumen/tambah', {
                    title: 'Tambah Dokumen',
                    user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
                    kategori,
                    error: 'Nomor dokumen sudah terdaftar!'
                });
            }
        }

        let uploadedFile = null;
        if (req.file) {
            uploadedFile = req.file.filename;
        }

        // Ambil ID terbaru untuk dokumen
        const [lastDoc] = await db.query('SELECT MAX(id) as maxId FROM documents');
        const newDocId = (lastDoc[0].maxId || 0) + 1;

        await db.query(
            'INSERT INTO documents (id, name, document_type_id, doc_no, unit_owner, scope, published, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())',
            [newDocId, name.trim(), document_type_id || null, doc_no || null, req.session.userId, scope || null, req.session.userId]
        );

        // Insert revisi pertama jika ada file
        if (uploadedFile) {
            const [lastRev] = await db.query('SELECT MAX(id) as maxId FROM document_revisions');
            const newRevId = (lastRev[0].maxId || 0) + 1;
            const now = new Date();

            await db.query(
                'INSERT INTO document_revisions (id, document_id, rev_no, doc_date, doc_month, doc_year, active, uploaded_file, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?, 1, ?, NOW(), NOW())',
                [newRevId, newDocId, now.getDate(), now.getMonth() + 1, now.getFullYear(), uploadedFile]
            );
        }

        res.redirect('/admin/dokumen?success=Dokumen berhasil ditambahkan');
    } catch (err) { next(err); }
};

// Tampilkan form edit
const editForm = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.redirect('/admin/dokumen?error=Dokumen tidak ditemukan');
        const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
        res.render('admin/dokumen/edit', {
            title: 'Edit Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            dokumen: rows[0],
            kategori,
            error: null
        });
    } catch (err) { next(err); }
};

// Proses edit dokumen
const edit = async (req, res, next) => {
    const { name, document_type_id, doc_no, scope } = req.body;
    try {
        if (!name || name.trim() === '') {
            const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
            const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
            return res.render('admin/dokumen/edit', {
                title: 'Edit Dokumen',
                user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
                dokumen: rows[0],
                kategori,
                error: 'Nama dokumen tidak boleh kosong!'
            });
        }

        if (doc_no && doc_no.trim() !== '') {
            const [existing] = await db.query('SELECT * FROM documents WHERE doc_no = ? AND id != ?', [doc_no.trim(), req.params.id]);
            if (existing.length > 0) {
                const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
                const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
                return res.render('admin/dokumen/edit', {
                    title: 'Edit Dokumen',
                    user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
                    dokumen: rows[0],
                    kategori,
                    error: 'Nomor dokumen sudah terdaftar!'
                });
            }
        }

        if (req.file) {
            const [revisi] = await db.query(
                'SELECT MAX(rev_no) as max_rev FROM document_revisions WHERE document_id = ?',
                [req.params.id]
            );
            const newRevNo = (revisi[0].max_rev || 0) + 1;
            const now = new Date();

            const [lastRev] = await db.query('SELECT MAX(id) as maxId FROM document_revisions');
            const newRevId = (lastRev[0].maxId || 0) + 1;

            await db.query('UPDATE document_revisions SET active = 0 WHERE document_id = ?', [req.params.id]);

            await db.query(
                'INSERT INTO document_revisions (id, document_id, rev_no, doc_date, doc_month, doc_year, active, uploaded_file, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())',
                [newRevId, req.params.id, newRevNo, now.getDate(), now.getMonth() + 1, now.getFullYear(), req.file.filename]
            );
        }

        await db.query(
            'UPDATE documents SET name = ?, document_type_id = ?, doc_no = ?, scope = ?, updated_at = NOW() WHERE id = ?',
            [name.trim(), document_type_id || null, doc_no || null, scope || null, req.params.id]
        );
        res.redirect('/admin/dokumen?success=Dokumen berhasil diupdate');
    } catch (err) { next(err); }
};

// Publish / Nonaktifkan dokumen
const togglePublish = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT published FROM documents WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.redirect('/admin/dokumen?error=Dokumen tidak ditemukan');
        const newStatus = rows[0].published === 1 ? 0 : 1;
        await db.query('UPDATE documents SET published = ?, updated_at = NOW() WHERE id = ?', [newStatus, req.params.id]);
        const msg = newStatus === 1 ? 'Dokumen berhasil dipublikasikan' : 'Dokumen berhasil dinonaktifkan';
        res.redirect('/admin/dokumen?success=' + msg);
    } catch (err) { next(err); }
};

// Upload versi baru
const uploadVersi = async (req, res, next) => {
    try {
        if (!req.file) return res.redirect(`/admin/dokumen/${req.params.id}?error=File tidak ditemukan`);

        const [revisi] = await db.query(
            'SELECT MAX(rev_no) as max_rev FROM document_revisions WHERE document_id = ?',
            [req.params.id]
        );
        const newRevNo = (revisi[0].max_rev || 0) + 1;
        const now = new Date();

        // Ambil ID terbaru untuk revisi
        const [lastRev] = await db.query('SELECT MAX(id) as maxId FROM document_revisions');
        const newRevId = (lastRev[0].maxId || 0) + 1;

        // Nonaktifkan revisi lama
        await db.query('UPDATE document_revisions SET active = 0 WHERE document_id = ?', [req.params.id]);

        // Insert revisi baru
        await db.query(
            'INSERT INTO document_revisions (id, document_id, rev_no, doc_date, doc_month, doc_year, active, uploaded_file, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())',
            [newRevId, req.params.id, newRevNo, now.getDate(), now.getMonth() + 1, now.getFullYear(), req.file.filename]
        );

        await db.query('UPDATE documents SET updated_at = NOW() WHERE id = ?', [req.params.id]);
        res.redirect(`/admin/dokumen/${req.params.id}?success=Versi baru berhasil diunggah`);
    } catch (err) { next(err); }
};

// Hapus dokumen
const hapus = async (req, res, next) => {
    try {
        await db.query('DELETE FROM document_revisions WHERE document_id = ?', [req.params.id]);
        await db.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
        res.redirect('/admin/dokumen?success=Dokumen berhasil dihapus');
    } catch (err) { next(err); }
};

module.exports = { index, detail, tambahForm, tambah, editForm, edit, togglePublish, uploadVersi, hapus };