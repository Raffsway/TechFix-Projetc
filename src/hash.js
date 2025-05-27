// TechFix/src/hash.js
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const plainPasswordAdmin = '12345678'; // Mude para a senha do admin

bcrypt.hash(plainPasswordAdmin, saltRounds, function(err, hash) {
    if (err) {
        console.error("Erro ao gerar hash:", err);
    } else {
        console.log(`Hash para '${plainPasswordAdmin}':`, hash);
        // Copie o hash gerado para usar no comando SQL INSERT
    }
});