// Génère une paire de clés VAPID (publique/privée) nécessaire pour Web Push.
// À exécuter UNE SEULE FOIS : node generate-vapid-keys.js
// Copie ensuite les valeurs affichées dans ton fichier .env

const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('=== Clés VAPID générées ===\n');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('\nCopie ces deux lignes dans un fichier .env à la racine du projet.');
console.log('Ajoute aussi une ligne ALERT_SECRET=un_mot_de_passe_secret (pour protéger le déclenchement).');
