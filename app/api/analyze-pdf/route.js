import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fonction pour extraire le texte du PDF avec pdftotext
async function extractPDFText(buffer, fileName) {
  try {
    console.log(`📄 Début extraction PDF avec pdftotext...`);
    
    // Créer des noms de fichiers temporaires corrects
    const tempDir = '/tmp';
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_'); // Nettoyer le nom
    const tempPdfPath = path.join(tempDir, `temp-${timestamp}-${cleanFileName}`);
    const tempTxtPath = path.join(tempDir, `temp-${timestamp}-output.txt`);
    
    console.log(`📁 Fichier PDF temporaire: ${tempPdfPath}`);
    console.log(`📁 Fichier TXT temporaire: ${tempTxtPath}`);
    
    // Écrire le buffer vers le fichier temporaire
    await fs.promises.writeFile(tempPdfPath, buffer);
    console.log(`✅ Fichier temporaire créé: ${tempPdfPath}`);
    
    try {
      // Utiliser pdftotext pour extraire le texte
      const command = `pdftotext "${tempPdfPath}" "${tempTxtPath}"`;
      console.log(`🔄 Exécution: ${command}`);
      
      await execAsync(command);
      console.log(`✅ pdftotext exécuté avec succès`);
      
      // Vérifier que le fichier texte existe
      if (!fs.existsSync(tempTxtPath)) {
        throw new Error('Le fichier de sortie n\'a pas été créé par pdftotext');
      }
      
      // Lire le fichier texte généré
      const extractedText = await fs.promises.readFile(tempTxtPath, 'utf8');
      console.log(`✅ Texte extrait: ${extractedText.length} caractères`);
      
      // Vérifier si le PDF est vide ou scanné
      if (extractedText.trim().length === 0) {
        console.warn('⚠️ PDF vide ou scanné détecté');
        return "PDF_SCANNED_OR_EMPTY";
      }
      
      return extractedText;
      
    } finally {
      // Nettoyer les fichiers temporaires
      try {
        if (fs.existsSync(tempPdfPath)) {
          await fs.promises.unlink(tempPdfPath);
          console.log(`🧹 PDF temporaire supprimé`);
        }
        if (fs.existsSync(tempTxtPath)) {
          await fs.promises.unlink(tempTxtPath);
          console.log(`🧹 TXT temporaire supprimé`);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Erreur nettoyage:', cleanupError.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur extraction PDF:', error);
    throw new Error(`Erreur lors de l'extraction PDF: ${error.message}`);
  }
}

// Fonction pour limiter le texte (simule première page)
function extractFirstPageText(fullText, maxChars = 2000) {
  console.log(`📄 Limitation du texte: ${fullText.length} -> ${Math.min(fullText.length, maxChars)} caractères`);
  return fullText.substring(0, maxChars);
}

export async function POST(request) {
  console.log('\n=== 🚀 DEBUT ANALYSE PDF AVEC PDFTOTEXT ===');
  
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

    // 3. Convertir le fichier en buffer
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

    // 4. Extraire le texte du PDF avec pdftotext
    console.log('🔍 === DEBUT EXTRACTION PDFTOTEXT ===');
    
    let pdfText;
    try {
      const fullText = await extractPDFText(buffer, file.name);
      
      // Vérifier si c'est un PDF scanné
      if (fullText === "PDF_SCANNED_OR_EMPTY") {
        console.warn('📷 PDF scanné ou vide détecté');
        return NextResponse.json(
          { 
            error: 'PDF scanné ou vide',
            details: 'Ce PDF semble être un scan d\'image ou ne contient pas de texte extractible',
            help: 'Essayez avec un PDF contenant du texte sélectionnable, ou utilisez un outil OCR',
            suggestion: 'Vous pouvez convertir votre PDF scanné en texte avec des outils comme Adobe Acrobat ou des services OCR en ligne'
          },
          { status: 400 }
        );
      }
      
      // Limiter à ~2000 caractères pour simuler une première page
      pdfText = extractFirstPageText(fullText, 2000);
      console.log(`✅ Extraction réussie:`);
      console.log(`   - Caractères extraits: ${pdfText.length}`);
      console.log(`   - Aperçu: "${pdfText.substring(0, 150)}..."`);
    } catch (err) {
      console.error('❌ ERREUR extraction PDF:', err);
      return NextResponse.json(
        { 
          error: 'Erreur extraction PDF',
          details: err.message,
          help: 'Le PDF peut être corrompu, protégé par mot de passe, ou contenir uniquement des images'
        },
        { status: 400 }
      );
    }

    // 5. Préparer l'analyse Claude
    console.log('🤖 === PREPARATION ANALYSE CLAUDE ===');
    
    const prompt = `Tu es un expert en analyse de documents. Analyse le texte suivant et réponds UNIQUEMENT à cette question :

QUESTION : Quel est le titre du document ?

TEXTE À ANALYSER (première partie du document) :
${pdfText}

INSTRUCTIONS :
- Identifie le titre principal du document
- Si c'est un PV, donne le titre complet (ex: "PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE DE COPROPRIÉTÉ")  
- Réponds seulement avec le titre, sans autre texte
- Si tu ne trouves pas de titre clair, réponds "Titre non identifié"`;

    console.log(`📝 Prompt préparé (${prompt.length} caractères)`);

    // 6. Envoyer à Claude
    console.log('📡 Envoi à Claude...');
    
    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: prompt
        }]
      });
      console.log('✅ Réponse reçue de Claude');
    } catch (err) {
      console.error('❌ ERREUR Claude:', err);
      return NextResponse.json(
        { 
          error: 'Erreur API Claude',
          details: err.message,
          help: 'Vérifiez votre clé API et votre crédit Anthropic'
        },
        { status: 500 }
      );
    }

    // 7. Traiter la réponse
    const titre = response.content[0].text.trim();
    console.log('🎯 TITRE IDENTIFIÉ:', titre);

    const analysisResults = {
      titre: titre,
      budget: "Extraction PDF réelle - première page analysée",
      grosTravaux: "Extraction PDF réelle - première page analysée", 
      petitsTravaux: "Extraction PDF réelle - première page analysée",
      litiges: "Extraction PDF réelle - première page analysée",
      info: `Analyse avec pdftotext - ${pdfText.length} caractères des premiers 2000`,
      fileName: file.name,
      fileSize: file.size,
      extractionMethod: "pdftotext"
    };

    console.log('🎉 === ANALYSE PDF TERMINÉE AVEC SUCCÈS ===\n');
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
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
} 