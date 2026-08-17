# Système d'alerte — Prototype (PWA + Web Push)

Système gratuit de notification d'urgence pour Galaxy XCover7 (Android).
Un bouton (web ou physique via un PC) envoie une notification push qui fait
vibrer/sonner le téléphone du collègue abonné.

## 1. Installation

```bash
cd alert-app
npm install
```

## 2. Générer les clés VAPID (une seule fois)

```bash
npm run generate-keys
```

Copie les deux lignes affichées, ainsi qu'un `ALERT_SECRET` de ton choix,
dans un fichier `.env` (voir `.env.example`) :

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
ALERT_SECRET=un_mot_de_passe_a_toi
PORT=3000
```

⚠️ Important : remplace aussi `CHANGE_MOI` par cette même valeur dans :
- `public/app.js` (constante `ALERT_TOKEN`)
- `trigger-alert.sh` et/ou `trigger-alert.ps1`

## 3. Lancer le serveur

```bash
npm start
```

Le serveur écoute sur `http://localhost:3000`.

## 4. ⚠️ HTTPS obligatoire (sauf en local)

Le Web Push (et les Service Workers) **ne fonctionnent que sur HTTPS**,
sauf sur `localhost`. Pour tester depuis un vrai téléphone sur le réseau :

- Solution rapide pour test : [ngrok](https://ngrok.com/) (`ngrok http 3000`)
  donne une URL HTTPS publique temporaire.
- Solution durable : héberger le serveur sur une petite machine du réseau
  local avec un certificat (ex: Caddy en reverse-proxy qui gère le HTTPS
  automatiquement, ou un certificat auto-signé installé manuellement sur
  les téléphones).

## 5. Sur chaque Galaxy XCover7 (côté collègue)

1. Ouvrir l'URL du serveur dans **Chrome**.
2. Cliquer sur **"🔔 Activer les alertes sur ce téléphone"** et accepter la
   permission de notification.
3. (Optionnel mais recommandé) Ajouter la page à l'écran d'accueil
   (menu Chrome > "Ajouter à l'écran d'accueil") pour un accès direct.
4. **Configurer une sonnerie dédiée** :
   `Paramètres > Applications > Chrome > Notifications` → chercher le canal
   correspondant au site (nommé d'après le `title` de la notif, "ALERTE") →
   choisir un son fort et personnalisé.
5. **Exclure ce canal du mode Ne pas déranger** dans les paramètres du canal
   (sinon la notif restera silencieuse si le téléphone est en DND).
6. **Désactiver l'optimisation de batterie pour Chrome** :
   `Paramètres > Batterie > Utilisation de la batterie par app > Chrome`
   → mettre sur "Sans restriction", pour éviter que le système ne tue le
   service en arrière-plan et retarde/bloque la réception du push.

## 6. Déclencher une alerte

- **Depuis le web** : bouton rouge "🚨 DÉCLENCHER L'ALERTE" sur la page.
- **Depuis un bouton physique / raccourci PC** :
  - Linux/Mac : `./trigger-alert.sh "Message optionnel"`
  - Windows : `.\trigger-alert.ps1 -Message "Message optionnel"`
  - Lier ce script à un raccourci clavier global, ou à un bouton USB/Arduino
    configuré en clavier (HID) qui déclenche ce raccourci.

## 7. Limites connues de ce prototype

- Stockage des abonnements dans un simple fichier JSON (`subscriptions.json`)
  — suffisant pour un usage interne à petite échelle, pas pour de la
  production à grande échelle.
- Le token d'alerte (`ALERT_TOKEN`) est visible dans le JS public
  (`app.js`). Acceptable pour un usage sur réseau local fermé ; à revoir
  (authentification utilisateur, token côté serveur uniquement) si l'app
  est exposée sur Internet.
- Testez en conditions réelles (téléphone en veille prolongée, mode
  silencieux, DND) avant de faire confiance au système pour une vraie
  urgence. Si la fiabilité n'est pas suffisante, l'étape suivante est un
  wrapper Android natif (TWA + Firebase Cloud Messaging) avec
  "full-screen intent", qui se comporte comme un appel entrant.

## Structure du projet

```
alert-app/
├── server.js              # backend Express + Web Push
├── generate-vapid-keys.js # génère les clés une fois
├── .env.example
├── package.json
├── trigger-alert.sh        # script bouton physique (Linux/Mac)
├── trigger-alert.ps1       # script bouton physique (Windows)
└── public/
    ├── index.html
    ├── app.js
    ├── sw.js               # service worker (reçoit les push)
    └── manifest.json
```
