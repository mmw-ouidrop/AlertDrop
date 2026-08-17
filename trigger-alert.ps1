# Script à lier à un raccourci clavier ou à un bouton physique (émulant une touche).
# Usage : .\trigger-alert.ps1 -Message "Message optionnel"

param(
    [string]$Message = "Alerte declenchee"
)

# --- A CONFIGURER ---
$ServerUrl = "http://localhost:3000"   # remplace par l'adresse reelle du serveur sur le reseau
$AlertToken = "MOuidrop2026"             # doit correspondre a ALERT_SECRET du serveur
$Poste = "Bureau accueil"              # identifie quel poste a declenche l'alerte

$body = @{
    message = $Message
    from    = $Poste
} | ConvertTo-Json

Invoke-RestMethod -Uri "$ServerUrl/api/alert" `
    -Method Post `
    -Headers @{ "X-Alert-Token" = $AlertToken } `
    -ContentType "application/json" `
    -Body $body
