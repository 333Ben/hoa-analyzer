import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PDFDocument } from 'pdf-lib';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

// Configuration AWS Textract
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  console.log('\n=== 🚀 DEBUT ANALYSE PDF NATIVE CLAUDE ===');
  
  try {
    // 1. Vérifier la clé API
    console.log('🔑 Vérification de la clé API Anthropic...');
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ERREUR: Clé API Anthropic manquante dans .env.local');
      return NextResponse.json(
        { 
          error: 'Configuration manquante',
          details: 'Clé API Anthropic non configurée dans .env.local'
        },
        { status: 500 }
      );
    }
    
    const keyLength = process.env.ANTHROPIC_API_KEY.length;
    const keyStart = process.env.ANTHROPIC_API_KEY.substring(0, 8);
    console.log(`✅ Clé API présente: ${keyStart}... (${keyLength} caractères)`);

    // 2. Lire les données du formulaire
    console.log('📥 Lecture des données du formulaire...');
    
    let formData;
    try {
      formData = await request.formData();
      console.log('✅ FormData lu avec succès');
    } catch (err) {
      console.error('❌ Erreur lecture FormData:', err);
      return NextResponse.json(
        { error: 'Erreur lecture formulaire', details: err.message },
        { status: 400 }
      );
    }

    const file = formData.get('pdf');
    console.log('📁 Fichier dans formData:', file ? 'OUI' : 'NON');

    if (!file) {
      console.error('❌ ERREUR: Aucun fichier PDF dans la requête');
      return NextResponse.json(
        { 
          error: 'Fichier manquant',
          details: 'Aucun fichier PDF fourni dans la requête'
        },
        { status: 400 }
      );
    }

    console.log(`✅ Fichier reçu:`);
    console.log(`   - Nom: ${file.name}`);
    console.log(`   - Taille: ${file.size} bytes`);
    console.log(`   - Type: ${file.type}`);

    // Vérifier la taille du fichier (limite Claude ~20MB)
    if (file.size > 20 * 1024 * 1024) {
      console.error('❌ ERREUR: Fichier trop volumineux');
      return NextResponse.json(
        { 
          error: 'Fichier trop volumineux',
          details: `Taille: ${(file.size / 1024 / 1024).toFixed(2)}MB. Limite: 20MB`,
          help: 'Compressez votre PDF ou utilisez seulement les premières pages'
        },
        { status: 400 }
      );
    }

    // 3. Convertir le fichier en buffer puis base64
    console.log('🔄 Conversion du fichier en buffer...');
    
    let buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
      console.log(`✅ Buffer créé: ${buffer.length} bytes`);
    } catch (err) {
      console.error('❌ Erreur conversion buffer:', err);
      return NextResponse.json(
        { error: 'Erreur traitement fichier', details: err.message },
        { status: 400 }
      );
    }

    // 4. Convertir en base64
    console.log('📊 Conversion en base64...');
    const pdfBase64 = buffer.toString('base64');
    console.log(`✅ Base64 créé: ${pdfBase64.length} caractères`);

    // 4.5. Préparer le prompt global
    console.log('🤖 === PREPARATION ANALYSE CLAUDE NATIVE ===');
    
    const prompt = `Tu es un expert en analyse de procès-verbaux de copropriété français. Analyse ce document PDF et extrais les informations suivantes au format JSON :

{
  "titre": "Titre complet du document",
  "budget": "Budget annuel ou charges prévisionnelles avec montants exacts",
  "grosTravaux": "Gros travaux planifiés ou votés avec détails et montants",
  "petitsTravaux": "Petits travaux d'entretien avec détails et montants", 
  "litiges": "Contentieux, impayés ou conflits mentionnés"
}

INSTRUCTIONS DÉTAILLÉES :
- Pour chaque champ, fournis des informations précises et complètes
- Inclus les montants exacts quand disponibles
- Si une information n'est pas trouvée, écris "Non trouvé" 
- Pour les montants, utilise le format "X€" ou "X euros"
- Sois précis sur les dates et échéances
- Résume clairement les décisions importantes

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    console.log(`📝 Prompt préparé (${prompt.length} caractères)`);

    // 4.5. Fonctions AWS Textract pour OCR
    async function processWithTextract(buffer) {
      console.log('🔄 === FALLBACK AWS TEXTRACT - OCR ===');
      try {
        console.log('📷 Début OCR avec AWS Textract...');
        
        const command = new AnalyzeDocumentCommand({
          Document: { Bytes: buffer },
          FeatureTypes: ['TABLES'] // Texte + Tables, ignorer images
        });
        
        console.log('☁️ Envoi vers AWS Textract...');
        const result = await textractClient.send(command);
        
        console.log(`📊 AWS Textract response: ${result.Blocks.length} blocks détectés`);
        const extractedText = extractTextFromTextract(result);
        
        console.log('✅ OCR AWS Textract terminé avec succès');
        console.log(`📝 Texte OCR extrait: ${extractedText.length} caractères`);
        console.log('🔤 Premiers caractères OCR:', extractedText.substring(0, 100));
        
        return extractedText;
      } catch (textractErr) {
        console.error('❌ Erreur AWS Textract:', textractErr);
        throw new Error(`Échec OCR AWS Textract: ${textractErr.message}`);
      }
    }
    
    function extractTextFromTextract(textractResult) {
      console.log('📋 Extraction du texte depuis AWS Textract...');
      
      // Filtrer pour ne garder que TEXT et TABLES (ignorer images)
      const textBlocks = textractResult.Blocks.filter(block => 
        block.BlockType === 'LINE' || block.BlockType === 'CELL'
      );
      
      // Extraire le texte de chaque block
      const textLines = textBlocks
        .filter(block => block.Text && block.Text.trim())
        .map(block => block.Text.trim())
        .filter(text => text.length > 0);
      
      console.log(`📄 ${textLines.length} lignes de texte extraites`);
      
      // Joindre toutes les lignes avec espaces
      const fullText = textLines.join(' ').replace(/\s+/g, ' ').trim();
      
      return fullText;
    }

    // 4.6. Fonction helper pour parser PDF en texte (inspirée de hoa-pdf2text)
    async function parsePdfToText(buffer) {
      console.log('📄 === PARSING PDF VERS TEXTE ===');
      try {
        console.log('🔍 Début de l\'analyse PDF...');
        
        // Import dynamique de pdf-parse pour éviter les erreurs au démarrage
        const pdfParse = (await import('pdf-parse')).default;
        
        const data = await pdfParse(buffer);
        const text = data.text;
        console.log('✅ PDF analysé avec succès');
        console.log('📝 Texte extrait (longueur):', text.length);
        console.log('�� Nombre de pages:', data.numpages);
        console.log('🔤 Premiers caractères du texte:', text.substring(0, 100));
        
        // Nettoyer et formater le texte
        const cleanText = text
          .replace(/\s+/g, ' ')  // Normaliser les espaces
          .trim();
        
        console.log(`✅ PDF parsé: ${cleanText.length} caractères`);
        return cleanText;
      } catch (parseErr) {
        console.error('❌ pdf-parse échoué:', parseErr.message);
        console.log('🔄 Passage au fallback AWS Textract (PDF scanné détecté)');
        
        // Fallback automatique vers AWS Textract
        return await processWithTextract(buffer);
      }
    }

    // 4.6. Analyser avec Claude (texte uniquement)
    async function analyzeWithText(text, method = 'text-fallback') {
      console.log(`🤖 === ANALYSE CLAUDE TEXTE (${method}) ===`);
      const textPrompt = `Tu es un expert en analyse de procès-verbaux de copropriété français. Analyse ce document PDF et extrais les informations suivantes au format JSON :

{
  "titre": "Titre complet du document",
  "budget": "Budget annuel ou charges prévisionnelles avec montants exacts",
  "grosTravaux": "Gros travaux planifiés ou votés avec détails et montants",
  "petitsTravaux": "Petits travaux d'entretien avec détails et montants", 
  "litiges": "Contentieux, impayés ou conflits mentionnés"
}

INSTRUCTIONS DÉTAILLÉES :
- Pour chaque champ, fournis des informations précises et complètes
- Inclus les montants exacts quand disponibles
- Si une information n'est pas trouvée, écris "Non trouvé" 
- Pour les montants, utilise le format "X€" ou "X euros"
- Sois précis sur les dates et échéances
- Résume clairement les décisions importantes

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.

TEXTE DU DOCUMENT:
${text}`;
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [{
          role: "user", 
          content: textPrompt
        }]
      });
      
      return { response, method };
    }

    // 4.7. Stratégie d'analyse intelligente
    console.log('🎯 === STRATÉGIE D\'ANALYSE INTELLIGENTE ===');
    const fileSizeKB = Math.round(file.size / 1024);
    console.log(`📏 Taille fichier: ${fileSizeKB} KB`);
    
    let response;
    let analysisMethod = 'claude-native-pdf';
    
    if (fileSizeKB > 500) {
      console.log('🔀 Stratégie: FORCER MODE TEXTE');
      console.log('📄 Fichier > 500KB : parsing texte direct...');
      try {
        const pdfText = await parsePdfToText(buffer);
        const result = await analyzeWithText(pdfText, 'large-file-text');
        response = result.response;
        analysisMethod = result.method;
        console.log('✅ Analyse texte réussie !');
      } catch (textErr) {
        console.error('❌ ÉCHEC analyse texte forcée:', textErr);
        return NextResponse.json(
          { 
            error: 'Erreur analyse texte',
            details: textErr.message,
            help: 'Le fichier est trop volumineux et l\'extraction de texte a échoué',
            fileSize: fileSizeKB
          },
          { status: 500 }
        );
      }
    } else {
      console.log('🔀 Stratégie: ESSAYER PDF NATIF D\'ABORD');
      console.log('📡 Essai PDF natif d\'abord...');
      try {
        response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022", // Modèle Claude 3.5 Sonnet stable
          max_tokens: 4000, // Plus de tokens pour une analyse complète
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64
                }
              }
            ]
          }]
        });
        console.log('✅ PDF natif réussi');
        analysisMethod = 'claude-native-pdf';
        
      } catch (err) {
        console.log('⚠️ PDF natif échoué, tentative parsing texte...');
        console.error('💡 Erreur PDF natif:', err.message);
        
        // Fallback : parser en texte si erreur 529 ou autre
        if (err.message.includes('overloaded') || err.status === 529) {
          console.log('🔄 FALLBACK: Parsing PDF vers texte...');
          try {
            const pdfText = await parsePdfToText(buffer);
            const result = await analyzeWithText(pdfText, 'overload-fallback');
            response = result.response;
            analysisMethod = result.method;
            console.log('✅ Fallback texte réussi !');
          } catch (fallbackErr) {
            console.error('❌ ÉCHEC total (PDF + Texte):', fallbackErr);
            return NextResponse.json(
              { 
                error: 'Erreur complète d\'analyse',
                details: `PDF natif: ${err.message}. Texte: ${fallbackErr.message}`,
                help: 'Ni l\'analyse PDF ni le parsing texte n\'ont fonctionné',
                fileSize: fileSizeKB
              },
              { status: 500 }
            );
          }
        } else {
          // Autre erreur que surcharge : pas de fallback
          console.error('❌ Erreur PDF non-récupérable:', err);
          return NextResponse.json(
            { 
              error: 'Erreur API Claude',
              details: err.message,
              help: 'Erreur non liée à la surcharge, pas de fallback possible',
              fileSize: fileSizeKB,
              type: err.constructor.name
            },
            { status: 500 }
          );
        }
      }
    }

    // 7. Traiter la réponse JSON
    console.log('🎯 Traitement de la réponse Claude...');
    const rawResponse = response.content[0].text.trim();
    console.log('📄 Réponse brute:', rawResponse.substring(0, 200) + '...');

    let analysisResults;
    try {
      // Parser la réponse JSON de Claude
      analysisResults = JSON.parse(rawResponse);
      console.log('✅ JSON parsé avec succès');
      
      // Ajouter des métadonnées
      analysisResults.info = `Analyse native Claude PDF - ${file.size} bytes`;
      analysisResults.fileName = file.name;
      analysisResults.fileSize = file.size;
      analysisResults.extractionMethod = "claude-native-pdf";
      analysisResults.model = "claude-3-5-sonnet-20241022";
      
    } catch (jsonErr) {
      console.warn('⚠️ Erreur parsing JSON, utilisation du texte brut');
      
      // Si le JSON parsing échoue, créer une structure de base
      analysisResults = {
        titre: "Analyse réussie mais format de réponse inattendu",
        budget: rawResponse.includes('budget') || rawResponse.includes('euros') ? 
          `Informations détectées - voir réponse complète` : "Non trouvé",
        grosTravaux: rawResponse.includes('travaux') ? 
          `Informations détectées - voir réponse complète` : "Non trouvé", 
        petitsTravaux: rawResponse.includes('entretien') || rawResponse.includes('réparation') ?
          `Informations détectées - voir réponse complète` : "Non trouvé",
        litiges: rawResponse.includes('litige') || rawResponse.includes('contentieux') ?
          `Informations détectées - voir réponse complète` : "Non trouvé",
        rawResponse: rawResponse, // Inclure la réponse brute pour debug
        info: `Analyse native Claude PDF - ${file.size} bytes - Format JSON inattendu`,
        fileName: file.name,
        fileSize: file.size,
        extractionMethod: "claude-native-pdf",
        model: "claude-3-5-sonnet-20241022"
      };
    }

    console.log('🎉 === ANALYSE PDF CLAUDE NATIVE TERMINÉE AVEC SUCCÈS ===\n');
    console.log('📊 Résultats:', {
      titre: analysisResults.titre?.substring(0, 50) + '...',
      budget: analysisResults.budget?.substring(0, 50) + '...',
      method: analysisResults.extractionMethod
    });

    return NextResponse.json(analysisResults);

  } catch (error) {
    console.error('\n💥 === ERREUR GLOBALE ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== FIN ERREUR ===\n');
    
    return NextResponse.json(
      { 
        error: 'Erreur système',
        details: error.message,
        type: error.constructor.name,
        help: 'Consultez les logs du serveur pour plus de détails'
      },
      { status: 500 }
    );
  }
} 