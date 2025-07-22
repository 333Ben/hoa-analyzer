# 🏢 HOA Analyzer

Analysez automatiquement vos procès-verbaux de copropriété français et extrayez les informations clés grâce à l'intelligence artificielle Claude d'Anthropic.

## 📊 Statut du Projet

### ✅ **Fonctionnalités Implémentées**
- ✅ **Interface Next.js** : Design moderne avec Tailwind CSS
- ✅ **Upload PDF** : Glisser-déposer fonctionnel
- ✅ **API Claude intégrée** : SDK Anthropic configuré
- ✅ **Variables d'environnement** : Configuration .env.local
- ✅ **Gestion d'erreurs** : Messages détaillés et debug
- ✅ **Extraction pdftotext** : Outil installé (poppler/pdftotext)

### 🔧 **Problème Actuel à Résoudre**
**📄 Extraction PDF** : Le système détecte seulement 16 caractères au lieu du contenu complet
- **Diagnostic** : PDF natif avec texte sélectionnable confirmé
- **Outils testés** : pdftotext (poppler) installé et fonctionnel
- **Statut** : Extraction technique à debugger

### 🚀 **Prochaines Étapes Prioritaires**

#### 1. **Résoudre l'extraction PDF** (Critique)
```bash
# Options à tester :
# Option A: Tester pdftotext manuellement
pdftotext -layout "votre-pv.pdf" output.txt

# Option B: Alternative avec pdf2json
npm install pdf2json

# Option C: OCR automatique si nécessaire  
brew install tesseract
npm install node-tesseract-ocr
```

#### 2. **Une fois l'extraction fonctionnelle**
- Étendre l'analyse Claude au document complet (pas que 2000 chars)
- Implémenter extraction complète : budget, travaux, litiges
- Ajouter export des résultats (JSON, PDF)
- Historique des analyses

#### 3. **Améliorations futures**
- Support multi-formats (Word, images)
- Interface de gestion (plusieurs PV)
- API REST publique

### 🛠️ **Démarrage Rapide pour Reprendre**

1. **Vérifier l'environnement**
   ```bash
   cd /Users/garance/Desktop/hoa-analyzer
   ls .env.local  # Doit exister avec ANTHROPIC_API_KEY
   ```

2. **Lancer le serveur**
   ```bash
   npm run dev
   # Ouvre http://localhost:3000
   ```

3. **Tester l'état actuel**
   - Upload PDF → Cliquez "Analyser le PV (Extraction réelle)"
   - Regarder les logs terminal pour diagnostic

4. **Debug extraction PDF**
   ```bash
   # Test manuel pdftotext
   pdftotext -v  # Vérifier installation
   pdftotext "votre-pv.pdf" test-output.txt
   cat test-output.txt  # Voir si extraction fonctionne
   ```

---

## ✨ Fonctionnalités

- 📄 **Upload de PDF** : Glissez-déposez vos PV de copropriété
- 🤖 **Analyse IA** : Extraction automatique via Claude d'Anthropic
- 📊 **Données structurées** : Budget, travaux, litiges clairement organisés
- 🎨 **Interface moderne** : Design responsive avec Tailwind CSS

## 🔍 Informations extraites

- **💰 Budget annuel** : Charges prévisionnelles et fonds de travaux
- **🔨 Gros travaux** : Rénovations importantes avec montants
- **🔧 Petits travaux** : Entretien courant et réparations
- **⚖️ Litiges** : Contentieux et impayés

## 🚀 Installation

### 1. Clonez le projet
\`\`\`bash
git clone [votre-repo]
cd hoa-analyzer
\`\`\`

### 2. Installez les dépendances
\`\`\`bash
npm install
\`\`\`

### 3. Configuration de l'API Anthropic

1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. Générez une clé API
3. Créez le fichier \`.env.local\` à la racine :

\`\`\`bash
ANTHROPIC_API_KEY=votre_clé_api_ici
NEXT_PUBLIC_APP_NAME=HOA Analyzer
\`\`\`

### 4. Installez pdftotext (extraction PDF)
\`\`\`bash
# macOS
brew install poppler

# Vérification
pdftotext -v
\`\`\`

### 5. Lancez l'application
\`\`\`bash
npm run dev
\`\`\`

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🛠️ Technologies utilisées

- **Next.js 15** - Framework React
- **React 19** - Interface utilisateur
- **Tailwind CSS** - Styles et design
- **Anthropic Claude SDK** - Analyse IA des documents ✅
- **poppler (pdftotext)** - Extraction de texte PDF
- **Lucide React** - Icônes modernes

## 📋 Structure du projet

\`\`\`
hoa-analyzer/
├── app/
│   ├── api/
│   │   └── analyze-pdf/
│   │       └── route.js      # API d'analyse PDF + Claude SDK
│   ├── globals.css           # Styles globaux
│   ├── layout.js            # Layout principal
│   └── page.js              # Page d'accueil
├── public/                  # Ressources statiques
├── .env.local              # Variables d'environnement (à créer)
└── package.json            # Dépendances
\`\`\`

## 🎯 Utilisation

1. **Ouvrez l'application** dans votre navigateur
2. **Glissez votre PDF** dans la zone de téléchargement
3. **Cliquez sur "Analyser le PV"**
4. **Consultez les résultats** organisés par catégorie

## 🔒 Sécurité

- Les fichiers PDF sont traités temporairement et automatiquement supprimés
- La clé API Anthropic est sécurisée dans les variables d'environnement
- Limite de taille de fichier : 10MB

## 🐛 Dépannage

### L'analyse ne fonctionne pas
- Vérifiez que votre clé API Anthropic est correctement configurée
- Assurez-vous que pdftotext est installé : `pdftotext -v`
- Testez l'extraction manuelle : `pdftotext "votre-pv.pdf" test.txt`

### Erreur de téléchargement
- Vérifiez que le fichier est bien au format PDF
- Respectez la limite de 10MB

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche feature (\`git checkout -b feature/amelioration\`)
3. Committez vos changements (\`git commit -m 'Ajouter fonctionnalité'\`)
4. Poussez vers la branche (\`git push origin feature/amelioration\`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier \`LICENSE\` pour plus de détails.

## 🌟 Améliorations futures

- [ ] **Résoudre extraction PDF** (priorité #1)
- [ ] Support d'autres formats de documents
- [ ] Historique des analyses
- [ ] Export des résultats (PDF, Excel)
- [ ] Analyse multi-langues
- [ ] API REST publique

---

**Développé avec ❤️ pour simplifier la gestion des copropriétés françaises**

### 📝 Notes de développement
- **SDK Claude** : ✅ Déjà intégré avec @anthropic-ai/sdk
- **État actuel** : Interface fonctionnelle, extraction PDF à debugger
- **Dernière session** : Janvier 2025 - Problème extraction pdftotext