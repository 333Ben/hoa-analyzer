import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

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

    // 5. Préparer l'analyse Claude avec document natif
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

    // 6. Envoyer le PDF directement à Claude
    console.log('📡 Envoi du PDF à Claude (support natif)...');
    
    let response;
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
      console.log('✅ Réponse reçue de Claude');
    } catch (err) {
      console.error('❌ ERREUR Claude:', err);
      
      // Gestion spécifique des erreurs Claude
      let errorMessage = err.message;
      let helpMessage = 'Vérifiez votre clé API et votre crédit Anthropic';
      
      if (err.message.includes('content_policy')) {
        errorMessage = 'Document refusé par la politique de contenu';
        helpMessage = 'Le PDF peut contenir du contenu non autorisé ou être corrompu';
      } else if (err.message.includes('overloaded')) {
        errorMessage = 'Service Claude temporairement surchargé';
        helpMessage = 'Réessayez dans quelques minutes';
      } else if (err.message.includes('context_length')) {
        errorMessage = 'Document trop long pour être analysé';
        helpMessage = 'Réduisez la taille du PDF ou utilisez moins de pages';
      }
      
      return NextResponse.json(
        { 
          error: 'Erreur API Claude',
          details: errorMessage,
          help: helpMessage,
          type: err.constructor.name
        },
        { status: 500 }
      );
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