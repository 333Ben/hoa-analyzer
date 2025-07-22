'use client';

import { useState } from 'react';
import { Upload, FileText, Search, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setDebugInfo(null);
      console.log('📁 Fichier sélectionné:', selectedFile.name, selectedFile.size, 'bytes');
    } else {
      setError('Veuillez sélectionner un fichier PDF valide.');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setDebugInfo(null);

    console.log('🚀 === DÉBUT ANALYSE FRONTEND ===');
    console.log('📄 Fichier:', file.name, `(${file.size} bytes)`);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      console.log('📡 Envoi vers /api/analyze-pdf...');
      
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Réponse reçue, status:', response.status);
      
      const data = await response.json();
      console.log('📊 Données:', data);

      if (!response.ok) {
        // Erreur avec détails
        console.error('❌ Erreur API:', data);
        
        setError({
          main: data.error || 'Erreur inconnue',
          details: data.details,
          help: data.help,
          type: data.type,
          status: response.status
        });

        setDebugInfo({
          status: response.status,
          timestamp: new Date().toLocaleTimeString(),
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        });
      } else {
        // Succès
        console.log('✅ Analyse réussie');
        setResults(data);
        setDebugInfo({
          status: 200,
          timestamp: new Date().toLocaleTimeString(),
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        });
      }
    } catch (err) {
      console.error('💥 Erreur réseau:', err);
      setError({
        main: 'Erreur de connexion',
        details: err.message,
        help: 'Vérifiez que le serveur fonctionne sur localhost:3000'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏢 HOA Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analysez automatiquement vos PV de copropriété et extrayez les informations clés : 
            budget, travaux et litiges
          </p>
          <div className="mt-4 px-4 py-2 bg-blue-100 border border-blue-400 rounded-lg text-blue-800">
            <strong>🚀 Analyse PDF Native Claude :</strong> Envoi direct du PDF à l'IA Claude pour analyse complète du document
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Téléchargez votre PV de copropriété
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer block w-full"
                >
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-gray-600">
                    Cliquez ici pour sélectionner un fichier PDF
                  </span>
                </label>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center text-green-700">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <div>
                      <p className="text-sm font-semibold">
                        Fichier sélectionné: {file.name}
                      </p>
                      <p className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Erreur détaillée */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                  <div className="flex items-start text-red-700 mb-3">
                    <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{error.main}</p>
                      {error.details && (
                        <p className="text-sm mt-1 text-red-600">{error.details}</p>
                      )}
                      {error.help && (
                        <p className="text-sm mt-2 text-orange-600 bg-orange-50 p-2 rounded">
                          💡 {error.help}
                        </p>
                      )}
                      {error.status && (
                        <p className="text-xs mt-2 text-gray-500">
                          Status HTTP: {error.status} | Type: {error.type || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info de debug */}
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Info className="h-4 w-4 mr-2" />
                    <span className="text-sm font-semibold">Informations de debug</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>🕒 Heure: {debugInfo.timestamp}</p>
                    <p>📊 Status: {debugInfo.status}</p>
                    <p>📄 Fichier: {debugInfo.file.name} ({debugInfo.file.size} bytes)</p>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    💡 Consultez la console du navigateur (F12) et les logs du terminal pour plus de détails
                  </div>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className={`mt-6 px-8 py-3 rounded-lg font-semibold transition-all ${
                  !file || isAnalyzing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Analyse en cours...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Analyser le PV (Analyse Native)
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                📊 Résultats de l'analyse
              </h2>
              
              {/* Titre du document - Section principale */}
              {results.titre && (
                <div className="mb-8 p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <h3 className="text-2xl font-bold text-blue-800 mb-3">
                    📄 Titre du document
                  </h3>
                  <p className="text-xl text-blue-900 font-semibold">
                    {results.titre}
                  </p>
                </div>
              )}
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Budget */}
                <div className="p-4 border rounded-lg opacity-50">
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    💰 Budget Annuel
                  </h3>
                  <p className="text-gray-700">{results.budget || 'Non trouvé'}</p>
                </div>

                {/* Gros Travaux */}
                <div className="p-4 border rounded-lg opacity-50">
                  <h3 className="text-lg font-semibold text-orange-600 mb-2">
                    🔨 Gros Travaux
                  </h3>
                  <p className="text-gray-700">{results.grosTravaux || 'Aucun'}</p>
                </div>

                {/* Petits Travaux */}
                <div className="p-4 border rounded-lg opacity-50">
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">
                    🔧 Petits Travaux
                  </h3>
                  <p className="text-gray-700">{results.petitsTravaux || 'Aucun'}</p>
                </div>

                {/* Litiges */}
                <div className="p-4 border rounded-lg opacity-50">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    ⚖️ Litiges
                  </h3>
                  <p className="text-gray-700">{results.litiges || 'Aucun'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
