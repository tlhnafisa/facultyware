var express = require("express");
var router = express.Router();
const db = require("../lib/db");
const indexController = require("../controllers/indexController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");

// Redirect root ke login
router.get("/", indexController.index);

// Route login
router.get("/login", indexController.loginPage);
router.post("/login", indexController.login);
router.get("/logout", indexController.logout);

// Route home (untuk user biasa)
router.get("/home", isAuthenticated, async (req, res, next) => {
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

    const [recentDocuments] = await db.query(`
      SELECT d.*, dt.name as kategori_name, r.rev_no
      FROM documents d
      LEFT JOIN document_types dt ON d.document_type_id = dt.id
      LEFT JOIN document_revisions r ON d.id = r.document_id AND r.active = 1
      WHERE d.published = 1 ${scopeFilter}
      ORDER BY d.created_at DESC
      LIMIT 5
    `);

    res.render("user/dashboard", { 
      title: "Dashboard",
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
      },
      recentDocuments
    });
  } catch (err) {
    next(err);
  }
});
// Route dashboard admin
router.get("/admin/dashboard", isAuthenticated, async (req, res, next) => {
  try {
    const [[{ totalDokumen }]] = await db.query('SELECT COUNT(*) as totalDokumen FROM documents');
    const [[{ totalKategori }]] = await db.query('SELECT COUNT(*) as totalKategori FROM document_types');
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');

    const [recentDocuments] = await db.query(`
      SELECT d.*, dt.name as kategori_name, r.rev_no
      FROM documents d
      LEFT JOIN document_types dt ON d.document_type_id = dt.id
      LEFT JOIN document_revisions r ON d.id = r.document_id AND r.active = 1
      ORDER BY d.created_at DESC
      LIMIT 5
    `);

    res.render("admin/dashboard", {
      title: "Dashboard Admin",
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
      },
      stats: {
        totalDokumen,
        totalKategori,
        totalUsers
      },
      recentDocuments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;