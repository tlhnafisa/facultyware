const db = require('../lib/db');
const bcrypt = require('bcryptjs');

// Tampilkan daftar pengguna
const list = async (req, res, next) => {
  try {
    const [pengguna] = await db.query(`
      SELECT u.id, u.name, u.nim_nip, u.email, u.created_at, r.name as role_name
      FROM users u
      LEFT JOIN model_has_roles mhr ON u.id = mhr.model_id
      LEFT JOIN roles r ON mhr.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    res.render('admin/pengguna/index', {
      title: 'Kelola Pengguna',
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
      },
      pengguna
    });
  } catch (err) {
    next(err);
  }
};

// Form tambah pengguna
const tambahForm = async (req, res, next) => {
  try {
    const [roles] = await db.query("SELECT * FROM roles WHERE name NOT IN ('admin', 'user') ORDER BY name ASC");
    res.render('admin/pengguna/tambah', {
      title: 'Tambah Pengguna',
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
      },
      roles,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Proses tambah pengguna
const tambah = async (req, res, next) => {
  const { name, nim_nip, email, password, role_id } = req.body;

  try {
    const [roles] = await db.query("SELECT * FROM roles WHERE name NOT IN ('admin', 'user') ORDER BY name ASC");

    if (!name || !email || !password || !role_id) {
      return res.render('admin/pengguna/tambah', {
        title: 'Tambah Pengguna',
        user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
        roles,
        error: 'Semua kolom bertanda bintang wajib diisi!'
      });
    }

    // Cek duplikasi email
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.render('admin/pengguna/tambah', {
        title: 'Tambah Pengguna',
        user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
        roles,
        error: 'Email sudah terdaftar!'
      });
    }

    // Cek duplikasi NIM / NIP
    if (nim_nip && nim_nip.trim() !== '') {
      const [existingNim] = await db.query('SELECT * FROM users WHERE nim_nip = ?', [nim_nip.trim()]);
      if (existingNim.length > 0) {
        return res.render('admin/pengguna/tambah', {
          title: 'Tambah Pengguna',
          user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
          roles,
          error: 'NIM / NIP sudah terdaftar!'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, nim_nip, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [name.trim(), nim_nip ? nim_nip.trim() : null, email.trim(), hashedPassword]
    );
    const userId = result.insertId;

    // Insert role
    await db.query(
      'INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, "App\\\\Models\\\\User", ?)',
      [role_id, userId]
    );

    res.redirect('/admin/pengguna');
  } catch (err) {
    next(err);
  }
};

// Form edit pengguna
const editForm = async (req, res, next) => {
  try {
    const [userRows] = await db.query(`
      SELECT u.id, u.name, u.nim_nip, u.email, mhr.role_id
      FROM users u
      LEFT JOIN model_has_roles mhr ON u.id = mhr.model_id
      WHERE u.id = ?
    `, [req.params.id]);

    if (userRows.length === 0) {
      return res.redirect('/admin/pengguna');
    }

    const [roles] = await db.query(`
      SELECT * FROM roles 
      WHERE name NOT IN ('admin', 'user') 
         OR id = ?
      ORDER BY name ASC
    `, [userRows[0].role_id]);

    res.render('admin/pengguna/edit', {
      title: 'Edit Pengguna',
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
      },
      editUser: userRows[0],
      roles,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Proses edit pengguna
const edit = async (req, res, next) => {
  const { name, nim_nip, email, password, role_id } = req.body;

  try {
    const [userRows] = await db.query(`
      SELECT u.id, u.name, u.nim_nip, u.email, mhr.role_id
      FROM users u
      LEFT JOIN model_has_roles mhr ON u.id = mhr.model_id
      WHERE u.id = ?
    `, [req.params.id]);

    const [roles] = await db.query(`
      SELECT * FROM roles 
      WHERE name NOT IN ('admin', 'user') 
         OR id = ?
      ORDER BY name ASC
    `, [userRows[0].role_id]);

    if (!name || !email || !role_id) {
      return res.render('admin/pengguna/edit', {
        title: 'Edit Pengguna',
        user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
        editUser: { id: req.params.id, name, nim_nip, email, role_id },
        roles,
        error: 'Kolom Nama, Email, dan Role wajib diisi!'
      });
    }

    // Cek duplikasi email jika diubah
    if (email.trim() !== userRows[0].email) {
      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim()]);
      if (existing.length > 0) {
        return res.render('admin/pengguna/edit', {
          title: 'Edit Pengguna',
          user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
          editUser: userRows[0],
          roles,
          error: 'Email sudah terdaftar!'
        });
      }
    }

    // Cek duplikasi NIM / NIP jika diubah
    if (nim_nip && nim_nip.trim() !== '' && nim_nip.trim() !== userRows[0].nim_nip) {
      const [existingNim] = await db.query('SELECT * FROM users WHERE nim_nip = ?', [nim_nip.trim()]);
      if (existingNim.length > 0) {
        return res.render('admin/pengguna/edit', {
          title: 'Edit Pengguna',
          user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail, role: req.session.userRole },
          editUser: userRows[0],
          roles,
          error: 'NIM / NIP sudah terdaftar!'
        });
      }
    }

    // Update user
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET name = ?, nim_nip = ?, email = ?, password = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), nim_nip ? nim_nip.trim() : null, email.trim(), hashedPassword, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE users SET name = ?, nim_nip = ?, email = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), nim_nip ? nim_nip.trim() : null, email.trim(), req.params.id]
      );
    }

    // Update role
    const [hasRole] = await db.query('SELECT * FROM model_has_roles WHERE model_id = ?', [req.params.id]);
    if (hasRole.length > 0) {
      await db.query(
        'UPDATE model_has_roles SET role_id = ? WHERE model_id = ?',
        [role_id, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, "App\\\\Models\\\\User", ?)',
        [role_id, req.params.id]
      );
    }

    res.redirect('/admin/pengguna');
  } catch (err) {
    next(err);
  }
};

// Hapus pengguna
const hapus = async (req, res, next) => {
  try {
    // Jangan izinkan admin menghapus akunnya sendiri
    if (parseInt(req.params.id, 10) === req.session.userId) {
      return res.redirect('/admin/pengguna');
    }

    await db.query('DELETE FROM model_has_roles WHERE model_id = ?', [req.params.id]);
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.redirect('/admin/pengguna');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  tambahForm,
  tambah,
  editForm,
  edit,
  hapus
};
