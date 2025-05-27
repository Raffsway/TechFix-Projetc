// src/backend/app.js
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const db = require("./db");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../../public")));

const uploadsDir = path.join(__dirname, "../../public/uploads/service_photos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../public/uploads"))
);

const JWT_SECRET =
  process.env.JWT_SECRET || "seuSegredoSuperSecretoParaDesenvolvimento";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        message: "Acesso negado. Token não fornecido ou mal formatado.",
      });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error.message);
    res.status(400).json({ message: "Token inválido." });
  }
};

const servicePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const photoUpload = multer({
  storage: servicePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Erro: Apenas imagens são permitidas (jpeg, jpg, png, gif)!"));
  },
});

// AUTH
app.post("/api/auth/register", async (req, res) => {
  // Nome e Telefone não são mais esperados do formulário de cadastro
  const { email, password, cpf } = req.body;

  if (!email || !password || !cpf) {
    return res
      .status(400)
      .json({
        message: "Email, Senha e CPF são obrigatórios para o cadastro.",
      });
  }
  try {
    const serviceCheck = await db.query(
      "SELECT * FROM services WHERE client_cpf = $1",
      [cpf]
    );
    if (
      serviceCheck.rows.length === 0 &&
      process.env.NODE_ENV !== "development_admin_seed"
    ) {
      return res
        .status(403)
        .json({
          message:
            "Cadastro não permitido. Nenhum serviço encontrado para este CPF.",
        });
    }

    const userExists = await db.query(
      "SELECT * FROM users WHERE email = $1 OR cpf = $2",
      [email, cpf]
    );
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: "Email ou CPF já cadastrado." });
    }
    const plainPasswordForTesting = password;

    // Insere NULL para 'name' e 'phone' na tabela users,
    // pois 'name' foi alterado para NULLABLE no schema do DB.
    // 'phone' já era NULLABLE.
    const newUser = await db.query(
      "INSERT INTO users (name, email, password, cpf, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, cpf, phone, role",
      [null, email, plainPasswordForTesting, cpf, null, "client"] // name e phone como null
    );
    res
      .status(201)
      .json({
        message: "Usuário cadastrado com sucesso!",
        user: newUser.rows[0],
      });
  } catch (error) {
    console.error("Erro no registro:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar registrar." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({
          message: "Email ou senha inválidos (usuário não encontrado).",
        });
    }
    const user = result.rows[0];
    const isMatch = password === user.password;
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email ou senha inválidos (senha não confere)." });
    }
    const tokenPayload = {
      id: user.id,
      role: user.role,
      cpf: user.cpf,
      name: user.name, // Será null se cadastrado sem nome e não atualizado
      email: user.email,
      phone: user.phone, // Será null se cadastrado sem telefone e não atualizado
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login bem-sucedido!", token, user: tokenPayload });
  } catch (error) {
    console.error("Erro no login:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar fazer login." });
  }
});

// USERS - Rota para atualizar perfil do usuário (mantida como na sua última versão)
app.put("/api/users/profile", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone, currentPassword, newPassword } = req.body;

  if (!name || !email) {
    // Nome e email continuam obrigatórios para ATUALIZAÇÃO de perfil
    return res.status(400).json({ message: "Nome e Email são obrigatórios." });
  }
  if (phone && phone.length > 0 && (phone.length < 10 || phone.length > 11)) {
    return res
      .status(400)
      .json({
        message:
          "Telefone deve ter 10 ou 11 dígitos, ou ser deixado em branco.",
      });
  }

  try {
    if (email !== req.user.email) {
      const emailExists = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (emailExists.rows.length > 0) {
        return res
          .status(409)
          .json({ message: "Este email já está em uso por outra conta." });
      }
    }

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    updateFields.push(`name = $${paramIndex++}`);
    queryParams.push(name);
    updateFields.push(`email = $${paramIndex++}`);
    queryParams.push(email);
    updateFields.push(`phone = $${paramIndex++}`);
    queryParams.push(phone === "" ? null : phone);

    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({
            message: "Senha atual é obrigatória para definir uma nova senha.",
          });
      }
      const userResult = await db.query(
        "SELECT password FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length === 0)
        return res.status(404).json({ message: "Usuário não encontrado." });

      const storedPassword = userResult.rows[0].password;
      if (currentPassword !== storedPassword) {
        return res.status(401).json({ message: "Senha atual incorreta." });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Nova senha deve ter pelo menos 6 caracteres." });
      }
      updateFields.push(`password = $${paramIndex++}`);
      queryParams.push(newPassword);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING id, name, email, cpf, phone, role`;
    const updatedUserResult = await db.query(updateQuery, queryParams);

    if (updatedUserResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Não foi possível atualizar o usuário." });
    }
    const updatedUser = updatedUserResult.rows[0];
    res.json({ message: "Perfil atualizado com sucesso!", user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    if (
      error.code === "23505" &&
      error.constraint &&
      error.constraint.includes("users_email_key")
    ) {
      return res
        .status(409)
        .json({ message: "Este email já está em uso por outra conta." });
    }
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao atualizar perfil." });
  }
});

// SERVICES
app.post("/api/services", authMiddleware, (req, res) => {
  photoUpload.single("photo")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: `Erro no upload da foto: ${err.message}` });
    } else if (err) {
      return res
        .status(400)
        .json({
          message: err.message || "Erro ao processar o arquivo de foto.",
        });
    }

    if (req.user.role !== "admin") {
      if (req.file)
        fs.unlink(
          req.file.path,
          (unlinkErr) =>
            unlinkErr && console.error("Erro ao deletar foto:", unlinkErr)
        );
      return res
        .status(403)
        .json({
          message:
            "Acesso negado. Apenas administradores podem criar serviços.",
        });
    }

    const {
      clientName,
      clientPhone,
      clientCpf,
      equipmentType,
      serviceType,
      description,
    } = req.body;
    const adminId = req.user.id;
    let photoUrl = req.file
      ? `/uploads/service_photos/${req.file.filename}`
      : null;

    if (
      !clientName ||
      !clientCpf ||
      !equipmentType ||
      !description ||
      !clientPhone
    ) {
      // Tornando clientPhone essencial aqui
      if (req.file)
        fs.unlink(
          req.file.path,
          (e) => e && console.error("Erro ao deletar foto:", e)
        );
      return res
        .status(400)
        .json({
          message:
            "Nome, Telefone, CPF do cliente, tipo de equipamento e descrição são obrigatórios.",
        });
    }
    const cleanedClientPhone = clientPhone
      ? clientPhone.replace(/\D/g, "")
      : null;
    if (
      cleanedClientPhone &&
      (cleanedClientPhone.length < 10 || cleanedClientPhone.length > 11)
    ) {
      if (req.file)
        fs.unlink(
          req.file.path,
          (e) => e && console.error("Erro ao deletar foto:", e)
        );
      return res
        .status(400)
        .json({ message: "Telefone do cliente deve ter 10 ou 11 dígitos." });
    }

    try {
      const newService = await db.query(
        "INSERT INTO services (client_cpf, client_name, client_phone, equipment_type, service_type, description, admin_id, status, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        [
          clientCpf,
          clientName,
          cleanedClientPhone,
          equipmentType,
          serviceType,
          description,
          adminId,
          "received",
          photoUrl,
        ]
      );
      res
        .status(201)
        .json({
          message: "Serviço criado com sucesso",
          service: newService.rows[0],
        });
    } catch (error) {
      console.error("Erro ao criar serviço no DB:", error);
      if (req.file)
        fs.unlink(
          req.file.path,
          (e) => e && console.error("Erro ao deletar foto:", e)
        );
      res
        .status(500)
        .json({ message: "Erro interno do servidor ao criar serviço." });
    }
  });
});

app.get("/api/services", authMiddleware, async (req, res) => {
  try {
    let servicesQuery;
    if (req.user.role === "admin") {
      // Pega client_name e client_phone diretamente da tabela services.
      // O JOIN com users ainda pode ser feito se você quiser exibir o nome do usuário REGISTRADO,
      // mas os dados primários do cliente para o serviço virão de s.client_name e s.client_phone.
      servicesQuery = db.query(
        `SELECT 
          s.id, s.client_cpf, 
          s.client_name,         -- Nome do cliente do serviço
          s.client_phone,        -- Telefone do cliente do serviço
          s.equipment_type, s.service_type, s.description, 
          s.status, s.created_at, s.updated_at, s.admin_id, s.photo_url,
          u.name as registered_user_name -- Nome do usuário se ele for registrado
        FROM services s 
        LEFT JOIN users u ON s.client_cpf = u.cpf 
        ORDER BY s.created_at DESC`
      );
    } else {
      servicesQuery = db.query(
        "SELECT * FROM services WHERE client_cpf = $1 ORDER BY created_at DESC",
        [req.user.cpf]
      );
    }
    const { rows } = await servicesQuery;
    // Para o admin, certificar que o nome exibido é o da tabela services, se houver
    const processedRows = rows.map((row) => {
      if (req.user.role === "admin") {
        return {
          ...row,
          // O frontend adminDashboard.js espera 'client_name' e 'client_phone'
          // A query já seleciona s.client_name e s.client_phone, que são os corretos.
          // registered_user_name é apenas informativo se você quiser usá-lo.
        };
      }
      return row;
    });
    res.json(processedRows);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao buscar serviços." });
  }
});

// Rotas PUT e DELETE para /api/services/:id permanecem como na sua última versão
app.put("/api/services/:id/status", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Apenas administradores podem alterar o status." });
  }
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "Novo status é obrigatório." });
  }
  try {
    const updatedService = await db.query(
      "UPDATE services SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (updatedService.rows.length === 0) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    // Se a tabela services foi alterada para incluir client_name e client_phone,
    // a resposta já os incluirá. Se você precisa do nome do usuário registrado:
    let responseService = updatedService.rows[0];
    if (req.user.role === "admin") {
      const userResult = await db.query(
        "SELECT name FROM users WHERE cpf = $1",
        [responseService.client_cpf]
      );
      if (userResult.rows.length > 0) {
        // Adiciona o nome do usuário registrado para consistência com o que o GET /api/services (admin) pode retornar
        // Embora, para esta rota, geralmente se retorna apenas o objeto do serviço atualizado.
        // O frontend que consome isso (adminDashboard.js no modal) já busca o nome do users via LEFT JOIN no fetchServices.
        // Então, a resposta direta do serviço é suficiente aqui.
      }
    }
    res.json(responseService);
  } catch (error) {
    console.error("Erro ao atualizar status do serviço:", error);
    res.status(500).json({ message: "Erro ao atualizar status do serviço." });
  }
});

app.delete("/api/services/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Apenas administradores podem excluir serviços." });
  }
  const { id } = req.params;
  try {
    const serviceResult = await db.query(
      "SELECT photo_url FROM services WHERE id = $1",
      [id]
    );
    if (serviceResult.rows.length > 0 && serviceResult.rows[0].photo_url) {
      const photoPath = path.join(
        __dirname,
        "../../public",
        serviceResult.rows[0].photo_url
      );
      if (
        serviceResult.rows[0].photo_url.trim() !== "" &&
        fs.existsSync(photoPath)
      ) {
        fs.unlink(photoPath, (err) => {
          if (err)
            console.error("Erro ao deletar foto do serviço:", photoPath, err);
        });
      }
    }
    const deleteOp = await db.query(
      "DELETE FROM services WHERE id = $1 RETURNING id",
      [id]
    );
    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    res.status(200).json({ message: `Serviço #${id} excluído com sucesso.` });
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    res.status(500).json({ message: "Erro ao excluir serviço." });
  }
});

// --- Rotas para servir HTML ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});
const htmlPages = [
  "login",
  "signup",
  "admin-dashboard",
  "client-dashboard",
  "new-service",
  "update-profile",
];
htmlPages.forEach((page) => {
  const route = `/${page}`;
  const filePath = `../../public/html/${page}.html`;
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, filePath));
  });
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/html/admin-dashboard.html"));
});
app.get("/cliente", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/html/client-dashboard.html"));
});

module.exports = app;
