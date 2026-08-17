// ⚠️ Le token ci-dessous doit correspondre à ALERT_SECRET défini côté serveur (.env).
// Pour un vrai déploiement, ne pas le laisser en clair dans le JS public :
// mettre la page derrière une authentification, ou déplacer le déclenchement
// vers une route protégée différemment. Pour un usage interne simple, ça reste
// acceptable si l'app n'est accessible que sur le réseau local.
const ALERT_TOKEN = 'MOuidrop2026'; // à remplacer par la même valeur que ALERT_SECRET

const statusEl = document.getElementById('status');
const subscribeBtn = document.getElementById('subscribeBtn');
const alertBtn = document.getElementById('alertBtn');
const messageInput = document.getElementById('messageInput');

function setStatus(text) {
  statusEl.textContent = text;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    setStatus('Service Worker non supporté sur ce navigateur.');
    return null;
  }
  return navigator.serviceWorker.register('/sw.js');
}

async function subscribeToPush() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus('Permission de notification refusée.');
      return;
    }

    const registration = await registerServiceWorker();
    const { publicKey } = await fetch('/api/vapid-public-key').then(r => r.json());

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    setStatus('✅ Alertes activées sur ce téléphone.');
  } catch (err) {
    console.error(err);
    setStatus('Erreur lors de l\'activation : ' + err.message);
  }
}

async function triggerAlert() {
  setStatus('Envoi en cours...');
  try {
    const res = await fetch('/api/alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Alert-Token': ALERT_TOKEN
      },
      body: JSON.stringify({
        message: messageInput.value || 'Alerte déclenchée',
        from: 'Interface web'
      })
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(`✅ Alerte envoyée à ${data.sent}/${data.total} destinataire(s).`);
    } else {
      setStatus('❌ ' + (data.error || 'Erreur inconnue'));
    }
  } catch (err) {
    setStatus('❌ Erreur réseau : ' + err.message);
  }
}

subscribeBtn.addEventListener('click', subscribeToPush);
alertBtn.addEventListener('click', triggerAlert);

// Enregistrement du SW dès le chargement (utile si déjà abonné précédemment)
registerServiceWorker();
