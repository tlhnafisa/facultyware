const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.redirect("/login");
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    if (req.session.userRole === 'admin') {
      return res.redirect("/admin/dashboard");
    }
    return res.redirect("/home");
  }
  res.render("login", { title: "Login - Kontrol Dokumen FTI", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Cari user berdasarkan email
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [username]);

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Email atau password salah!",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Email atau password salah!",
      });
    }

    // Cek role user dari tabel RBAC
   const [roleRows] = await db.query(`
    SELECT r.name as role_name 
    FROM roles r
    JOIN model_has_roles mhr ON r.id = mhr.role_id
    WHERE mhr.model_id = ?
`, [user.id]);
    const role = roleRows.length > 0 ? roleRows[0].role_name : 'user';
    console.log(`[DEBUG LOGIN] Email: ${user.email}, ID: ${user.id}, RoleRows:`, roleRows, `, Computed Role: ${role}`);

    // Simpan data ke session
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userRole = role;

    // Redirect berdasarkan role
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      if (role === 'admin') {
        return res.redirect("/admin/dashboard");
      } else {
        return res.redirect("/home");
      }
    });

  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  index,
  loginPage,
  login,
  logout
};