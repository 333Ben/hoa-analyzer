# 🔍 Configuration AWS Textract - Guide OCR

## **🎯 Fonctionnalité**
Support automatique des PDF scannés avec OCR AWS Textract haute qualité.

## **🛠️ Configuration AWS**

### **1. Créer un compte AWS**
- Allez sur [aws.amazon.com](https://aws.amazon.com)
- Créez un compte (gratuit)
- Activez le service **AWS Textract**

### **2. Créer des clés d'accès IAM**

**a) Accédez à IAM :**
- Console AWS → Services → IAM → Users

**b) Créez un utilisateur :**
- Add User → Nom: `hoa-analyzer-textract`
- Access type: `Programmatic access`

**c) Permissions requises :**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "textract:AnalyzeDocument"
            ],
            "Resource": "*"
        }
    ]
}
```

**d) Récupérez les clés :**
- `Access Key ID` 
- `Secret Access Key`

### **3. Configuration locale**

**Créez le fichier `.env.local` :**
```bash
# Configuration API Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-votre_cle_anthropic_ici

# Configuration AWS Textract pour OCR
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1

# Configuration application
NEXT_PUBLIC_APP_NAME=HOA Analyzer
```

## **🚀 Test de l'OCR**

### **Démarrage :**
```bash
npm run dev
# Ouvre http://localhost:3000 (ou 3001)
```

### **Test avec PDF scanné :**
1. Uploadez un PDF scanné (image)
2. Logs attendus :
```
❌ pdf-parse échoué: [erreur]
🔄 Passage au fallback AWS Textract (PDF scanné détecté)
🔄 === FALLBACK AWS TEXTRACT - OCR ===
📷 Début OCR avec AWS Textract...
☁️ Envoi vers AWS Textract...
✅ OCR AWS Textract terminé avec succès
📝 Texte OCR extrait: 2847 caractères
```

## **💰 Coût AWS Textract**

- **$1.50 per 1000 pages**
- **PV 15 pages ≈ $0.02**  
- **Limite 10MB par document**
- **Niveau gratuit :** 1000 pages/mois pendant 3 mois

## **🔧 Dépannage**

### **Erreur "Access Denied" :**
- Vérifiez vos clés AWS dans `.env.local`
- Vérifiez les permissions IAM pour Textract

### **Erreur "Invalid region" :**
- Utilisez `eu-west-1` (Paris) pour la France
- Ou `us-east-1` (défaut)

### **Timeout :**
- Gros PDF peuvent prendre 30s-2min
- Vérifiez la limite de 10MB AWS Textract

## **📋 Architecture**

```
📄 PDF uploadé
    ↓
📝 TRY: pdf-parse (extraction normale)
    ↓
✅ SUCCESS → 🚀 Claude Analysis
    ↓
❌ CATCH: pdf-parse échoue (PDF scanné)
    ↓
🔍 AWS Textract OCR (texte + tables)
    ↓
🚀 Claude Analysis
```

**Résultat :** Support universel PDF natifs + scannés ! 