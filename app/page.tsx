'use client';

import { useState } from 'react';
import ParticipantForm from './components/ParticipantForm';
import AudioRecorder from './components/AudioRecorder';
import RecordingsList from './components/RecordingsList';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';

interface ParticipantData {
  nom: string;
  prenom: string;
  commune: string;
  email: string;
  telephone: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'recording' | 'archives'>('recording');
  const [step, setStep] = useState<'form' | 'recording' | 'uploading' | 'success'>('form');
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadResult, setUploadResult] = useState<{ message: string; url?: string } | null>(null);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const handleFormSubmit = (data: ParticipantData) => {
    setParticipantData(data);
    setStep('recording');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    setIsRecording(false);
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handleNewRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setAudioBlob(null); // Reset l'audio blob pour un nouvel enregistrement
  };

  const handleRecordingComplete = async (blob: Blob, shouldRedirectHome = false) => {
    setAudioBlob(blob);

    // Si c'est un "Terminer" depuis l'état pausé, sauvegarder puis rediriger
    if (shouldRedirectHome && participantData) {
      try {
        setStep('uploading');

        const formData = new FormData();
        formData.append('audio', blob, 'entretien.webm');
        formData.append('metadata', JSON.stringify(participantData));

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          // Sauvegarde réussie, afficher le toast et rediriger vers l'accueil
          showSuccess('Enregistrement sauvegardé avec succès !');
          handleReset();
        } else {
          throw new Error(result.error || 'Erreur upload');
        }
      } catch (error) {
        console.error('Erreur upload:', error);
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
        setStep('recording');
      }
    }
  };

  const handleUpload = async () => {
    if (!audioBlob || !participantData) return;

    setStep('uploading');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'entretien.webm');
      formData.append('metadata', JSON.stringify(participantData));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        setStep('success');
        showSuccess('Enregistrement envoyé avec succès !');
      } else {
        throw new Error(result.error || 'Erreur upload');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'envoi. Veuillez réessayer.');
      setStep('recording');
    }
  };

  const handleReset = () => {
    setStep('form');
    setParticipantData(null);
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setUploadResult(null);
    setActiveTab('recording');
  };

  const handleViewArchives = () => {
    setActiveTab('archives');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Victoires Populaires
          </h1>
          <h2 className="text-lg sm:text-xl text-blue-600 mb-4">
            Campagne d&apos;Écoute Citoyenne
          </h2>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Partagez votre voix, contribuez au changement
          </p>
        </div>

        {/* Système d'onglets */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 justify-center overflow-x-auto">
              <button
                onClick={() => setActiveTab('recording')}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm tab-transition whitespace-nowrap ${activeTab === 'recording'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="hidden sm:inline">Nouvel Enregistrement</span>
                  <span className="sm:hidden">Enregistrer</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('archives')}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm tab-transition whitespace-nowrap ${activeTab === 'archives'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Archives
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Indicateur d'étapes (seulement pour l'onglet enregistrement) */}
        {activeTab === 'recording' && (
          <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto px-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-max">
              <div className={`flex items-center ${step === 'form' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-base ${step === 'form' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'
                  }`}>
                  {step !== 'form' ? '✓' : '1'}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Informations</span>
              </div>

              <div className="w-4 sm:w-8 h-0.5 bg-gray-300"></div>

              <div className={`flex items-center ${step === 'recording' ? 'text-blue-600' :
                ['uploading', 'success'].includes(step) ? 'text-green-600' : 'text-gray-400'
                }`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-base ${step === 'recording' ? 'border-blue-600 bg-blue-50' :
                  ['uploading', 'success'].includes(step) ? 'border-green-600 bg-green-50' : 'border-gray-300'
                  }`}>
                  {['uploading', 'success'].includes(step) ? '✓' : '2'}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Enregistrement</span>
              </div>

              <div className="w-4 sm:w-8 h-0.5 bg-gray-300"></div>

              <div className={`flex items-center ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-base ${step === 'success' ? 'border-green-600 bg-green-50' : 'border-gray-300'
                  }`}>
                  {step === 'success' ? '✓' : '3'}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Terminé</span>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          {activeTab === 'archives' ? (
            <RecordingsList
              onRefresh={() => { }}
              onShowToast={(message, type) => {
                if (type === 'success') showSuccess(message);
                else if (type === 'error') showError(message);
              }}
            />
          ) : (
            <>
              {step === 'form' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Vos informations
                  </h3>
                  <ParticipantForm onSubmit={handleFormSubmit} />
                </div>
              )}

              {step === 'recording' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Enregistrement de l&apos;entretien
                  </h3>
                  {participantData && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-600">
                        <strong>Participant :</strong> {participantData.prenom} {participantData.nom} - {participantData.commune}
                      </p>
                    </div>
                  )}

                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isRecording={isRecording}
                    isPaused={isPaused}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onPauseRecording={handlePauseRecording}
                    onResumeRecording={handleResumeRecording}
                    onNewRecording={handleNewRecording}
                  />

                  {audioBlob && !isRecording && !isPaused && (
                    <div className="mt-6 text-center">
                      <p className="text-green-600 mb-4">
                        ✓ Enregistrement terminé ({Math.round(audioBlob.size / 1024)} KB)
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            setIsRecording(false);
                          }}
                          className="px-4 sm:px-6 py-2 border-2 border-orange-500 text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 hover:border-orange-600 transition-colors font-medium text-sm sm:text-base"
                        >
                          Recommencer
                        </button>
                        <button
                          onClick={handleUpload}
                          className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                          Envoyer l&apos;entretien
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'uploading' && (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    Envoi en cours...
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-2">
                    Votre entretien est en cours d&apos;upload, veuillez patienter.
                  </p>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl sm:text-2xl text-green-600">✓</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">
                    Entretien envoyé avec succès !
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                    Merci {participantData?.prenom} pour votre participation à cette campagne d&apos;écoute.
                  </p>
                  {uploadResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-6 text-left mx-2">
                      <p className="text-xs sm:text-sm text-green-800">
                        <strong>Statut :</strong> {uploadResult.message}
                      </p>
                      {uploadResult.url && (
                        <p className="text-xs text-green-700 mt-1 break-all">
                          <strong>Référence :</strong> {uploadResult.url}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                    <button
                      onClick={handleViewArchives}
                      className="px-4 sm:px-6 py-2 border-2 border-blue-600 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-700 transition-colors font-medium text-sm sm:text-base"
                    >
                      Voir les archives
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      Nouvel entretien
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500 px-2">
          <p>
            Vos données sont protégées et traitées conformément au RGPD.
            <br />
            Contact : contact@victoires-populaires.fr
          </p>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-20 right-4 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
