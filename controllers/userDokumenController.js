const db = require('../lib/db');

// Fitur 14 & 16 & 17 (Nasywa): Lihat daftar, cari, filter dokumen yang dipublish
const index = async (req, res, next) => {
    try {
        const { search, kategori_id } = req.query;
        const role = req.session.userRole;
        let scopeFilter = '';
        if (role === 'pegawai') {
            scopeFilter = " AND (LOWER(d.scope) = 'pegawai' OR LOWER(d.scope) = 'pegawai/dosen' OR LOWER(d.scope) = 'seluruh fti')";
        } else if (role === 'mahasiswa') {
            scopeFilter = " AND (LOWER(d.scope) = 'mahasiswa' OR LOWER(d.scope) = 'seluruh fti')";
        } else if (role !== 'admin') {
            scopeFilter = " AND LOWER(d.scope) = 'seluruh fti'";
        }

        let query = `
            SELECT d.*, dt.name as kategori_name, u.name as created_by_name,
                   r.rev_no, r.uploaded_file
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            LEFT JOIN document_revisions r ON d.id = r.document_id AND r.active = 1
            WHERE d.published = 1 ${scopeFilter}
        `;
        const params = [];

        if (search && search.trim() !== '') {
            query += ' AND d.name LIKE ?';
            params.push(`%${search.trim()}%`);
        }

        if (kategori_id && kategori_id.trim() !== '') {
            query += ' AND d.document_type_id = ?';
            params.push(kategori_id);
        }

        query += ' ORDER BY d.created_at DESC';

        const [dokumen] = await db.query(query, params);
        const [kategori] = await db.query('SELECT * FROM document_types ORDER BY name ASC');

        res.render('user/dokumen/index', {
            title: 'Kelola Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            dokumen,
            kategori,
            search: search || '',
            kategori_id: kategori_id || '',
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) { next(err); }
};

// Fitur 15 (Nasywa): Lihat detail dokumen yang dipublish
const detail = async (req, res, next) => {
    try {
        const role = req.session.userRole;
        let scopeFilter = '';
        if (role === 'pegawai') {
            scopeFilter = " AND (LOWER(d.scope) = 'pegawai' OR LOWER(d.scope) = 'pegawai/dosen' OR LOWER(d.scope) = 'seluruh fti')";
        } else if (role === 'mahasiswa') {
            scopeFilter = " AND (LOWER(d.scope) = 'mahasiswa' OR LOWER(d.scope) = 'seluruh fti')";
        } else if (role !== 'admin') {
            scopeFilter = " AND LOWER(d.scope) = 'seluruh fti'";
        }

        const [rows] = await db.query(`
            SELECT d.*, dt.name as kategori_name, u.name as created_by_name
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            WHERE d.id = ? AND d.published = 1 ${scopeFilter}
        `, [req.params.id]);

        if (rows.length === 0) return res.redirect('/dokumen?error=Dokumen tidak ditemukan atau Anda tidak memiliki akses');

        const [revisi] = await db.query(
            'SELECT * FROM document_revisions WHERE document_id = ? ORDER BY rev_no DESC',
            [req.params.id]
        );

        res.render('user/dokumen/detail', {
            title: 'Detail Dokumen',
            user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
            dokumen: rows[0],
            revisi
        });
    } catch (err) { next(err); }
};

module.exports = { index, detail };