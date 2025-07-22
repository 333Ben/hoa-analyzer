# HOA Analyzer - Analyseur de PV de Copropriété

Application Next.js utilisant l'API Claude pour extraire automatiquement les données importantes des procès-verbaux de copropriété.

## 🎯 Objectif

Extraire et structurer les informations clés des PV de copropriété :
- Budget annuel (montants, résultats de vote)
- Gros travaux (toiture, ravalement, ascenseur, canalisation)
- Petits travaux d'embellissement (peintures, électricité, hall, porte cochère)
- Litiges et procédures juridiques

## 🛠 Technologies

- **Next.js 15** - Framework React avec App Router
- **Tailwind CSS** - Framework CSS utilitaire
- **Anthropic Claude SDK** - API d'intelligence artificielle
- **Formidable** - Gestion d'upload de fichiers
- **Lucide React** - Icônes modernes

## 📋 Prérequis

- Node.js 18+ 
- Compte Anthropic avec clé API
- Navigateur moderne

## 🚀 Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd hoa-analyzer
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env.local
# Ajouter votre clé API Anthropic dans .env.local
```

4. Lancer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine avec :

```
ANTHROPIC_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_NAME=HOA Analyzer
```

### Obtenir une clé API Anthropic

1. Aller sur [console.anthropic.com](https://console.anthropic.com/)
2. Se connecter avec votre compte Claude
3. Créer une nouvelle clé API
4. L'ajouter dans `.env.local`

## 📁 Structure du projet

```
hoa-analyzer/
├── app/
│   ├── api/
│   │   └── analyze-pdf/
│   │       └── route.js          # API endpoint pour l'analyse PDF
│   ├── components/
│   │   └── PDFAnalyzer.js         # Composant principal
│   ├── globals.css                # Styles globaux
│   ├── layout.js                  # Layout principal
│   └── page.js                    # Page d'accueil
├── public/                        # Assets statiques
├── .env.local                     # Variables d'environnement (à créer)
├── .env.example                   # Exemple de configuration
├── package.json                   # Dépendances et scripts
└── README.md                      # Documentation
```

## 🎛 Utilisation

1. **Upload d'un PDF** : Glissez-déposez ou sélectionnez un PV de copropriété
2. **Analyse** : Cliquez sur "Analyser le document"
3. **Résultats** : Consultez les données extraites structurées
4. **Export** : Téléchargez les résultats en JSON

## 📊 Format des données extraites

```json
{
  "budget_annuel": {
    "numero_clause": "6",
    "objet_vote": "Fixation du budget prévisionnel",
    "montant": "105 000,00 €",
    "resultat": "Approuvé"
  },
  "gros_travaux": [
    {
      "numero_clause": "10",
      "objet_vote": "Reprise maçonnerie façade",
      "budget": "4 909,85 € TTC",
      "resultat": "Approuvé"
    }
  ],
  "petits_travaux": [...],
  "litiges": [...]
}
```

## 🔧 Développement

### Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production  
- `npm run start` - Serveur de production
- `npm run lint` - Vérification du code

### Ajout de nouvelles fonctionnalités

1. Modifier le prompt d'extraction dans `app/api/analyze-pdf/route.js`
2. Adapter l'interface dans `app/components/PDFAnalyzer.js`
3. Tester avec différents types de PV

## 🐛 Dépannage

### Erreurs courantes

- **"API key not found"** : Vérifiez le fichier `.env.local`
- **"Failed to parse PDF"** : Assurez-vous que le PDF est lisible (pas un scan image)
- **Timeout** : Les gros PDF peuvent prendre du temps à analyser

### Logs de debug

Les erreurs détaillées sont visibles dans :
- Console navigateur (F12)
- Terminal Next.js pour les erreurs serveur

## 🚀 Déploiement

Compatible avec Vercel, Netlify ou toute plateforme supportant Next.js.

N'oubliez pas d'ajouter vos variables d'environnement sur la plateforme de déploiement !

## 📜 Licence

MIT

## 👥 Contribution

Les contributions sont bienvenues ! Merci d'ouvrir une issue avant de proposer des changements majeurs.

---

**Note** : Cette application est optimisée pour les PV de copropriété français. Les performances peuvent varier selon le format et la qualité des documents.