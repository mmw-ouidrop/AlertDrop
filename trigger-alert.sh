#!/bin/bash
# Script à lier à un raccourci clavier ou à un bouton physique (émulant une touche).
# Usage : ./trigger-alert.sh "Message optionnel"

# --- À CONFIGURER ---
SERVER_URL="http://localhost:3000"   # remplace par l'adresse réelle du serveur sur le réseau
ALERT_TOKEN="MOuidrop2026"             # doit correspondre à ALERT_SECRET du serveur
POSTE="Bureau accueil"               # identifie quel poste a déclenché l'alerte

MESSAGE="${1:-Alerte déclenchée}"

curl -s -X POST "$SERVER_URL/api/alert" \
  -H "Content-Type: application/json" \
  -H "X-Alert-Token: $ALERT_TOKEN" \
  -d "{\"message\": \"$MESSAGE\", \"from\": \"$POSTE\"}"

echo ""
