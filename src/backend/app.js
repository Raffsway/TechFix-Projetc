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
const bcrypt = require("bcryptjs");

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
    return res.status(401).json({
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

const adminOnlyMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Acesso negado. Recurso exclusivo para administradores.",
    });
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
  const { email, password, cpf } = req.body;
  const cleanedCpf = cpf ? cpf.replace(/\D/g, "") : null;

  if (!email || !password || !cleanedCpf) {
    return res.status(400).json({
      message: "Email, Senha e CPF são obrigatórios para o cadastro.",
    });
  }
  if (cleanedCpf.length !== 11) {
    return res.status(400).json({ message: "CPF deve conter 11 dígitos." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Senha deve ter no mínimo 6 caracteres." });
  }

  try {
    const emailExists = await db.query(
      "SELECT * FROM users WHERE email = $1 AND password IS NOT NULL",
      [email]
    );
    if (emailExists.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Este email já está associado a uma conta ativa." });
    }

    const userByCpfResult = await db.query(
      "SELECT * FROM users WHERE cpf = $1",
      [cleanedCpf]
    );
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (userByCpfResult.rows.length > 0) {
      const existingUser = userByCpfResult.rows[0];
      if (existingUser.email && existingUser.password) {
        return res
          .status(409)
          .json({ message: "CPF já cadastrado com uma conta ativa." });
      } else {
        const updatedUser = await db.query(
          "UPDATE users SET email = $1, password = $2, updated_at = CURRENT_TIMESTAMP WHERE cpf = $3 RETURNING id, name, email, cpf, phone, role, cep, estado, cidade, bairro",
          [email, hashedPassword, cleanedCpf]
        );
        return res.status(200).json({
          message: "Cadastro finalizado com sucesso!",
          user: updatedUser.rows[0],
        });
      }
    } else {
      const serviceCheck = await db.query(
        "SELECT * FROM services WHERE client_cpf = $1",
        [cleanedCpf]
      );
      if (
        serviceCheck.rows.length === 0 &&
        process.env.NODE_ENV !== "development_admin_seed"
      ) {
        return res.status(403).json({
          message:
            "Cadastro não permitido. Nenhum serviço encontrado para este CPF. Contate o administrador.",
        });
      }
      const newUser = await db.query(
        "INSERT INTO users (email, password, cpf, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, cpf, phone, role, cep, estado, cidade, bairro",
        [email, hashedPassword, cleanedCpf, "client"]
      );
      return res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        user: newUser.rows[0],
      });
    }
  } catch (error) {
    console.error("Erro no registro:", error);
    if (error.code === "23505" && error.constraint === "users_email_key") {
      return res.status(409).json({ message: "Este email já está em uso." });
    }
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
      return res.status(401).json({
        message: "Usuário não encontrado com este email.",
      });
    }
    const user = result.rows[0];

    if (!user.password) {
      return res.status(401).json({
        message:
          "Cadastro pendente. Por favor, complete seu registro na tela de 'Cadastre-se'.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Senha inválida." });
    }
    const tokenPayload = {
      id: user.id,
      role: user.role,
      cpf: user.cpf,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cep: user.cep,
      estado: user.estado,
      cidade: user.cidade,
      bairro: user.bairro,
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

app.put("/api/users/profile", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    email,
    phone,
    currentPassword,
    newPassword,
    cep,
    estado,
    cidade,
    bairro,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Nome e Email são obrigatórios." });
  }
  const cleanedPhone = phone ? phone.replace(/\D/g, "") : null;
  if (cleanedPhone && (cleanedPhone.length < 10 || cleanedPhone.length > 11)) {
    return res.status(400).json({
      message: "Telefone deve ter 10 ou 11 dígitos, ou ser deixado em branco.",
    });
  }
  const cleanedCep = cep ? cep.replace(/\D/g, "") : null;
  if (cleanedCep && cleanedCep.length !== 8) {
    return res
      .status(400)
      .json({ message: "CEP deve ter 8 dígitos, ou ser deixado em branco." });
  }

  try {
    const currentUserData = await db.query(
      "SELECT email, password FROM users WHERE id = $1",
      [userId]
    );
    if (currentUserData.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    const userFromDb = currentUserData.rows[0];

    if (email !== userFromDb.email) {
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
    queryParams.push(cleanedPhone);
    updateFields.push(`cep = $${paramIndex++}`);
    queryParams.push(cleanedCep);
    updateFields.push(`estado = $${paramIndex++}`);
    queryParams.push(estado);
    updateFields.push(`cidade = $${paramIndex++}`);
    queryParams.push(cidade);
    updateFields.push(`bairro = $${paramIndex++}`);
    queryParams.push(bairro);

    if (newPassword) {
      if (!userFromDb.password && !currentPassword) {
        /* Permite definir senha pela primeira vez */
      } else if (!currentPassword && userFromDb.password) {
        return res.status(400).json({
          message: "Senha atual é obrigatória para definir uma nova senha.",
        });
      } else if (userFromDb.password) {
        const isCurrentPasswordMatch = await bcrypt.compare(
          currentPassword,
          userFromDb.password
        );
        if (!isCurrentPasswordMatch) {
          return res.status(401).json({ message: "Senha atual incorreta." });
        }
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Nova senha deve ter pelo menos 6 caracteres." });
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push(`password = $${paramIndex++}`);
      queryParams.push(hashedNewPassword);
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING id, name, email, cpf, phone, role, cep, estado, cidade, bairro`;
    const updatedUserResult = await db.query(updateQuery, queryParams);

    if (updatedUserResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Não foi possível atualizar o usuário." });
    }
    res.json({
      message: "Perfil atualizado com sucesso!",
      user: updatedUserResult.rows[0],
    });
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

// --- ROTA PARA ADMIN VERIFICAR CPF ---
app.get(
  "/api/admin/clients/check-cpf/:cpf",
  authMiddleware,
  adminOnlyMiddleware,
  async (req, res) => {
    const { cpf } = req.params;
    const cleanedCpf = cpf ? cpf.replace(/\D/g, "") : "";

    if (!cleanedCpf || cleanedCpf.length !== 11) {
      return res
        .status(400)
        .json({ message: "Formato de CPF inválido para verificação." });
    }

    try {
      const userExistsResult = await db.query(
        "SELECT id FROM users WHERE cpf = $1",
        [cleanedCpf]
      );
      if (userExistsResult.rows.length > 0) {
        return res
          .status(200)
          .json({ exists: true, message: "CPF já cadastrado no sistema." });
      } else {
        return res.status(200).json({ exists: false });
      }
    } catch (error) {
      console.error("Erro ao verificar CPF no backend:", error);
      res
        .status(500)
        .json({ message: "Erro interno do servidor ao verificar CPF." });
    }
  }
);

// --- ROTA PARA ADMIN ADICIONAR INFO CLIENTE (APENAS CRIAÇÃO) ---
app.post(
  "/api/admin/clients",
  authMiddleware,
  adminOnlyMiddleware,
  async (req, res) => {
    const { name, cpf, phone, cep, estado, cidade, bairro } = req.body;
    const cleanedCpf = cpf ? cpf.replace(/\D/g, "") : null;
    const cleanedPhone = phone ? phone.replace(/\D/g, "") : null;
    const cleanedCep = cep ? cep.replace(/\D/g, "") : null;

    if (!name || !cleanedCpf) {
      return res.status(400).json({ message: "Nome e CPF são obrigatórios." });
    }
    if (cleanedCpf.length !== 11) {
      return res.status(400).json({ message: "CPF deve conter 11 dígitos." });
    }
    if (
      cleanedPhone &&
      (cleanedPhone.length < 10 || cleanedPhone.length > 11)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Telefone deve ter 10 ou 11 dígitos (ou ser deixado em branco).",
        });
    }
    if (cleanedCep && cleanedCep.length !== 8) {
      return res
        .status(400)
        .json({
          message: "CEP deve ter 8 dígitos (ou ser deixado em branco).",
        });
    }

    try {
      // Verifica se o CPF já existe. Se sim, retorna erro 409.
      const userExistsResult = await db.query(
        "SELECT id FROM users WHERE cpf = $1",
        [cleanedCpf]
      );
      if (userExistsResult.rows.length > 0) {
        return res.status(409).json({
          message:
            "Este CPF já está cadastrado no sistema. Não é possível adicionar novamente por esta tela.",
        });
      }

      // CPF não existe, então CRIA um novo "pré-registro"
      const newClientInfo = await db.query(
        "INSERT INTO users (name, cpf, phone, cep, estado, cidade, bairro, role, email, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL) RETURNING *",
        [
          name,
          cleanedCpf,
          cleanedPhone,
          cleanedCep,
          estado,
          cidade,
          bairro,
          "client",
        ]
      );
      return res.status(201).json({
        message:
          "Informações do novo cliente adicionadas com sucesso! O cliente precisará se registrar para definir email e senha.",
        client: newClientInfo.rows[0],
      });
    } catch (error) {
      console.error(
        "Erro ao adicionar informações do cliente pelo admin:",
        error
      );
      //  Este erro de constraint unique_violation para CPF deve ser pego pela checagem acima.
      if (
        error.code === "23505" &&
        error.constraint &&
        error.constraint.includes("users_cpf_key")
      ) {
        return res
          .status(409)
          .json({
            message: "Este CPF já está registrado (erro de constraint).",
          });
      }
      res
        .status(500)
        .json({
          message:
            "Erro interno do servidor ao tentar adicionar informações do cliente.",
        });
    }
  }
);

// Rota para buscar dados do cliente por CPF (usada no form de Novo Serviço)
app.get(
  "/api/clients/by-cpf/:cpf",
  authMiddleware,
  adminOnlyMiddleware,
  async (req, res) => {
    const { cpf } = req.params;
    const cleanedCpf = cpf.replace(/\D/g, "");
    if (cleanedCpf.length !== 11) {
      return res.status(400).json({ message: "CPF fornecido é inválido." });
    }
    try {
      // Retorna os dados incluindo email para que o frontend saiba se o cliente já se registrou completamente
      const result = await db.query(
        "SELECT id, name, phone, cpf, email, cep, estado, cidade, bairro FROM users WHERE cpf = $1",
        [cleanedCpf]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Nenhuma informação de cliente encontrada para este CPF.",
        });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao buscar cliente por CPF:", error);
      res
        .status(500)
        .json({ message: "Erro interno do servidor ao buscar cliente." });
    }
  }
);

// SERVICES
app.post("/api/services", authMiddleware, adminOnlyMiddleware, (req, res) => {
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
    const cleanedClientCpf = clientCpf ? clientCpf.replace(/\D/g, "") : null;
    const cleanedClientPhone = clientPhone
      ? clientPhone.replace(/\D/g, "")
      : null;

    if (
      !clientName ||
      !cleanedClientCpf ||
      !equipmentType ||
      !description ||
      !cleanedClientPhone
    ) {
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
    if (cleanedClientCpf.length !== 11) {
      if (req.file)
        fs.unlink(
          req.file.path,
          (e) => e && console.error("Erro ao deletar foto:", e)
        );
      return res
        .status(400)
        .json({ message: "CPF do cliente deve ter 11 dígitos." });
    }
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
      const clientUser = await db.query(
        "SELECT role FROM users WHERE cpf = $1",
        [cleanedClientCpf]
      );
      if (clientUser.rows.length > 0 && clientUser.rows[0].role === "admin") {
        if (req.file)
          fs.unlink(
            req.file.path,
            (e) => e && console.error("Erro ao deletar foto não salva:", e)
          );
        return res
          .status(403)
          .json({
            message:
              "Não é permitido criar ordens de serviço para usuários administradores.",
          });
      }

      const newService = await db.query(
        "INSERT INTO services (client_cpf, client_name, client_phone, equipment_type, service_type, description, admin_id, status, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        [
          cleanedClientCpf,
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
    let query;
    const params = [];
    if (req.user.role === "admin") {
      query = `SELECT s.id, s.client_cpf, s.client_name, s.client_phone, s.equipment_type, s.service_type, s.description, s.status, s.created_at, s.updated_at, s.admin_id, s.photo_url, u.name as registered_user_name, u.email as registered_user_email FROM services s LEFT JOIN users u ON s.client_cpf = u.cpf ORDER BY s.created_at DESC`;
    } else {
      query =
        "SELECT * FROM services WHERE client_cpf = $1 ORDER BY created_at DESC";
      params.push(req.user.cpf);
    }
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao buscar serviços." });
  }
});

app.put(
  "/api/services/:id/status",
  authMiddleware,
  adminOnlyMiddleware,
  async (req, res) => {
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
      res.json(updatedService.rows[0]);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      res.status(500).json({ message: "Erro ao atualizar status do serviço." });
    }
  }
);

app.delete(
  "/api/services/:id",
  authMiddleware,
  adminOnlyMiddleware,
  async (req, res) => {
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
            if (err) console.error("Erro ao deletar foto:", photoPath, err);
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
  }
);

// HTML Routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../../public/index.html"))
);
const htmlPages = [
  "login",
  "signup",
  "admin-dashboard",
  "client-dashboard",
  "new-service",
  "update-profile",
  "add-client",
];
htmlPages.forEach((page) => {
  app.get(`/${page}`, (req, res) =>
    res.sendFile(path.join(__dirname, `../../public/html/${page}.html`))
  );
});
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "../../public/html/admin-dashboard.html"))
);
app.get("/cliente", (req, res) =>
  res.sendFile(path.join(__dirname, "../../public/html/client-dashboard.html"))
);

module.exports = app;
