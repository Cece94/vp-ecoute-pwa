'use client';

import { useState } from 'react';
import ParticipantForm from './components/ParticipantForm';
import AudioRecorder from './components/AudioRecorder';

interface ParticipantData {
  nom: string;
  prenom: string;
  commune: string;
  email: string;
  telephone: string;
}

export default function Home() {
  const [step, setStep] = useState<'form' | 'recording' | 'uploading' | 'success'>('form');
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadResult, setUploadResult] = useState<{ message: string; url?: string } | null>(null);

  const handleFormSubmit = (data: ParticipantData) => {
    setParticipantData(data);
    setStep('recording');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
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
    setAudioBlob(null);
    setUploadResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Victoires Populaires
          </h1>
          <h2 className="text-xl text-blue-600 mb-4">
            Campagne d&apos;Écoute Citoyenne
          </h2>
          <p className="text-gray-600">
            Partagez votre voix, contribuez au changement
          </p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === 'form' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'form' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'
                }`}>
                {step !== 'form' ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Informations</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-300"></div>

            <div className={`flex items-center ${step === 'recording' ? 'text-blue-600' :
              ['uploading', 'success'].includes(step) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'recording' ? 'border-blue-600 bg-blue-50' :
                ['uploading', 'success'].includes(step) ? 'border-green-600 bg-green-50' : 'border-gray-300'
                }`}>
                {['uploading', 'success'].includes(step) ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Enregistrement</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-300"></div>

            <div className={`flex items-center ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'success' ? 'border-green-600 bg-green-50' : 'border-gray-300'
                }`}>
                {step === 'success' ? '✓' : '3'}
              </div>
              <span className="ml-2 text-sm font-medium">Terminé</span>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">
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
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />

              {audioBlob && !isRecording && (
                <div className="mt-6 text-center">
                  <p className="text-green-600 mb-4">
                    ✓ Enregistrement terminé ({Math.round(audioBlob.size / 1024)} KB)
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setIsRecording(false);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Recommencer
                    </button>
                    <button
                      onClick={handleUpload}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Envoyer l&apos;entretien
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'uploading' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Envoi en cours...
              </h3>
              <p className="text-gray-600">
                Votre entretien est en cours d&apos;upload, veuillez patienter.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-600">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Entretien envoyé avec succès !
              </h3>
              <p className="text-gray-600 mb-4">
                Merci {participantData?.prenom} pour votre participation à cette campagne d&apos;écoute.
              </p>
              {uploadResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-green-800">
                    <strong>Statut :</strong> {uploadResult.message}
                  </p>
                  {uploadResult.url && (
                    <p className="text-xs text-green-700 mt-1 break-all">
                      <strong>Référence :</strong> {uploadResult.url}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nouvel entretien
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Vos données sont protégées et traitées conformément au RGPD.
            <br />
            Contact : contact@victoires-populaires.fr
          </p>
        </div>
      </div>
    </div>
  );
}
