# VP Écoute - Application PWA pour Campagne d'Écoute Citoyenne

Application web progressive (PWA) pour la collecte d'entretiens audio dans le cadre des campagnes d'écoute des Victoires Populaires.

## 🚀 Démarrage rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration (optionnel)
Pour utiliser Google Cloud Storage, copiez `env.example` vers `.env.local` et configurez :
```bash
cp env.example .env.local
```

Éditez `.env.local` avec vos variables GCS :
```env
SERVICE_ACCOUNT_KEY_BASE64=votre_clé_base64
GCS_BUCKET=votre-bucket-name
```

**Note :** Sans configuration GCS, l'app fonctionne en mode local (fichiers dans `/tmp/uploads`).

### 3. Lancement en développement
```bash
npm run dev
```
➡️ Ouvrez [http://localhost:3000](http://localhost:3000)

### 4. Build et déploiement
```bash
npm run build
npm start
```

## 📱 Déploiement sur Vercel

### Déploiement automatique
1. Connectez votre repo GitHub à Vercel
2. Variables d'environnement dans Vercel (optionnel) :
   - `SERVICE_ACCOUNT_KEY_BASE64` : Clé service account GCP en base64
   - `GCS_BUCKET` : Nom du bucket Google Cloud Storage

### Déploiement manuel
```bash
npm install -g vercel
vercel --prod
```

## 🔧 Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|---------|
| `SERVICE_ACCOUNT_KEY_BASE64` | Clé de service GCP encodée en base64 | Non* |
| `GCS_BUCKET` | Nom du bucket Google Cloud Storage | Non* |

*\*Si non définies, l'application fonctionne en mode local*

### Obtenir la clé de service en base64
```bash
# Linux/Mac
cat service-account-key.json | base64 -w 0

# Windows
certutil -encode service-account-key.json temp.txt && findstr /v /c:- temp.txt
```

## 🎯 Fonctionnalités

- ✅ **Interface mobile-first** : Optimisée smartphone
- ✅ **PWA** : Installation possible sur l'écran d'accueil
- ✅ **Enregistrement audio** : WebM mono 16kHz (optimal Speech-to-Text)
- ✅ **Upload intelligent** : GCS si configuré, sinon local
- ✅ **Validation RGPD** : Consentement obligatoire
- ✅ **Offline-ready** : Service worker intégré

## 🗂️ Structure

```
vp_audio/
├── app/
│   ├── api/upload/route.ts      # API endpoint upload
│   ├── components/
│   │   ├── AudioRecorder.tsx    # Composant enregistrement
│   │   └── ParticipantForm.tsx  # Formulaire participant
│   ├── page.tsx                 # Page principale
│   └── layout.tsx               # Layout PWA
├── public/
│   ├── manifest.json            # Manifeste PWA
│   └── sw.js                    # Service Worker
└── package.json
```

## 🔍 Développement

L'application suit un workflow en 3 étapes :
1. **Formulaire** : Collecte des données personnelles + consentement
2. **Enregistrement** : Audio WebM optimisé pour transcription
3. **Upload** : Vers GCS ou stockage local selon configuration

### Formats supportés
- **Audio** : WebM (navigateurs modernes), fallback MP4
- **Qualité** : 16kHz mono (optimal Google Speech-to-Text)
- **Durée max** : 20 minutes recommandées

### APIs utilisées
- **MediaRecorder API** : Enregistrement natif navigateur
- **FormData API** : Upload multipart
- **Service Worker API** : Fonctionnement offline
