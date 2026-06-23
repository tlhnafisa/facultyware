const db = require('../lib/db');

// Fitur 22: Admin dapat mengakses data kategori dokumen melalui API JSON
const adminKategori = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM document_types ORDER BY name ASC');
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Fitur 23: Admin dapat mengakses data dokumen melalui API JSON
const adminDokumen = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.*, dt.name as kategori_name, u.name as created_by_name
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            ORDER BY d.created_at DESC
        `);
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Fitur 24 & 26: Pengguna dapat mengakses daftar & mencari dokumen yang dipublish melalui API JSON
const userDokumen = async (req, res) => {
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
            SELECT d.id, d.name, d.doc_no, d.scope, d.created_at,
                   dt.name as kategori_name, r.rev_no, r.uploaded_file
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
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

        const [rows] = await db.query(query, params);
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Fitur 25: Pengguna dapat mengakses detail dokumen melalui API JSON
const userDokumenDetail = async (req, res) => {
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
            SELECT d.id, d.name, d.doc_no, d.scope, d.published, d.created_at,
                   dt.name as kategori_name, u.name as created_by_name
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            WHERE d.id = ? AND d.published = 1 ${scopeFilter}
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan, belum dipublikasikan, atau Anda tidak memiliki akses' });
        }

        const [revisi] = await db.query(
            'SELECT * FROM document_revisions WHERE document_id = ? ORDER BY rev_no DESC',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                dokumen: rows[0],
                revisi: revisi
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Fitur Baru: Tambah kategori dokumen via API JSON
const createKategori = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Nama kategori tidak boleh kosong!' });
        }
        const [lastId] = await db.query('SELECT MAX(id) as maxId FROM document_types');
        const newId = (lastId[0].maxId || 0) + 1;
        await db.query(
            'INSERT INTO document_types (id, name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
            [newId, name.trim()]
        );
        res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data: { id: newId, name: name.trim() } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    adminKategori,
    adminDokumen,
    userDokumen,
    userDokumenDetail,
    createKategori
};
