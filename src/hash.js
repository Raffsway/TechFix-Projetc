// TechFix/src/hash.js
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const plainPasswordClient = 'cliente123'; // Defina a senha do cliente aqui

bcrypt.hash(plainPasswordClient, saltRounds, function(err, hash) {
    if (err) {
        console.error("Erro ao gerar hash:", err);
    } else {
        console.log(`Hash para '${plainPasswordClient}':`, hash);
        // Copie o hash gerado para usar no comando SQL INSERT
    }
});