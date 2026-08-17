// Serveur principal : sert la PWA, gère les abonnements Web Push
// et déclenche l'envoi de notifications sur demande (bouton web ou bouton physique).

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 3000;
const SUBS_FILE = path.join(__dirname, 'subscriptions.json');

// --- Vérification de la config ---
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, ALERT_SECRET } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Clés VAPID manquantes. Lance d\'abord: npm run generate-keys');
  process.exit(1);
}
if (!ALERT_SECRET) {
  console.error('ALERT_SECRET manquant dans le .env (protège le déclenchement des alertes).');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Stockage simple des abonnements (fichier JSON) ---
function loadSubscriptions() {
  if (!fs.existsSync(SUBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
function saveSubscriptions(subs) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

// --- Route : clé publique VAPID (nécessaire côté client) ---
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// --- Route : enregistrer un abonnement (un téléphone qui veut recevoir les alertes) ---
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Abonnement invalide' });
  }

  const subs = loadSubscriptions();
  const exists = subs.some(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    subs.push(subscription);
    saveSubscriptions(subs);
    console.log('Nouvel abonnement enregistré. Total:', subs.length);
  }
  res.status(201).json({ ok: true });
});

// --- Route : désabonnement ---
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  let subs = loadSubscriptions();
  subs = subs.filter(s => s.endpoint !== endpoint);
  saveSubscriptions(subs);
  res.json({ ok: true });
});

// --- Route : déclencher l'alerte (bouton web OU bouton physique via script) ---
app.post('/api/alert', async (req, res) => {
  const token = req.header('X-Alert-Token');
  if (token !== ALERT_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const message = (req.body && req.body.message) || 'Alerte déclenchée';
  const sender = (req.body && req.body.from) || 'Poste inconnu';

  const subs = loadSubscriptions();
  if (subs.length === 0) {
    return res.status(400).json({ error: 'Aucun destinataire abonné aux alertes.' });
  }

  const payload = JSON.stringify({
    title: '🚨 ALERTE',
    body: `${message} (${sender})`,
    timestamp: Date.now()
  });

  const results = await Promise.allSettled(
    subs.map(sub => webpush.sendNotification(sub, payload))
  );

  // Nettoyage des abonnements devenus invalides (téléphone désinstallé, etc.)
  const stillValid = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' || (r.reason && r.reason.statusCode !== 410 && r.reason.statusCode !== 404)) {
      stillValid.push(subs[i]);
    }
  });
  if (stillValid.length !== subs.length) saveSubscriptions(stillValid);

  const sent = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Alerte envoyée à ${sent}/${subs.length} destinataire(s).`);
  res.json({ ok: true, sent, total: subs.length });
});

app.listen(PORT, () => {
  console.log(`Serveur d'alerte démarré sur http://localhost:${PORT}`);
});
