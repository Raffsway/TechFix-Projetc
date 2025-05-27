// src/backend/server.js
const app = require('./app'); // Importa a configuração do app de app.js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor TechFix rodando na porta ${PORT}. `);
  console.log(`Acesse: http://localhost:${PORT}`);
});