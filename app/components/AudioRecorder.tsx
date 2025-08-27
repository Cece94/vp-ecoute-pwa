'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, shouldRedirectHome?: boolean) => void;
    isRecording: boolean;
    isPaused: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onPauseRecording: () => void;
    onResumeRecording: () => void;
    onNewRecording: () => void;
}

export default function AudioRecorder({
    onRecordingComplete,
    isRecording,
    isPaused,
    onStartRecording,
    onStopRecording,
    onPauseRecording,
    onResumeRecording,
    onNewRecording
}: AudioRecorderProps) {
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const accumulatedChunksRef = useRef<Blob[]>([]); // Pour stocker tous les chunks lors des reprises

    useEffect(() => {
        // Vérifier les permissions au montage
        checkMicrophonePermission();

        return () => {
            // Nettoyage
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000, // Optimal pour Speech-to-Text
                    channelCount: 1,   // Mono
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            setHasPermission(true);
            stream.getTracks().forEach(track => track.stop()); // Arrêter le test
        } catch (error) {
            console.error('Permission microphone refusée:', error);
            setHasPermission(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            streamRef.current = stream;
            chunksRef.current = [];

            // Configuration pour WebM (compatible avec la plupart des navigateurs)
            const options = { mimeType: 'audio/webm' };
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Ajouter les nouveaux chunks aux chunks accumulés
                accumulatedChunksRef.current = [...accumulatedChunksRef.current, ...chunksRef.current];

                // Nettoyage du stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start(1000); // Collecte de données chaque seconde
            onStartRecording();

            // Démarrer le compteur (conserver la durée si c'est une reprise)
            if (!isPaused) {
                setDuration(0);
                accumulatedChunksRef.current = []; // Reset pour un nouvel enregistrement
            }
            intervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Erreur démarrage enregistrement:', error);
            setHasPermission(false);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            onPauseRecording();

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            onStopRecording();

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        // Créer le blob final avec tous les chunks accumulés
        const audioBlob = new Blob(accumulatedChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
    };

    const finalizeRecording = () => {
        // Terminer définitivement l'enregistrement depuis l'état pausé
        onStopRecording();

        // Créer le blob final avec tous les chunks accumulés
        const audioBlob = new Blob(accumulatedChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, true); // true = rediriger vers l'accueil
    };

    const resumeRecording = () => {
        startRecording();
        onResumeRecording();
    };

    const newRecording = () => {
        // Reset complet
        setDuration(0);
        accumulatedChunksRef.current = [];
        chunksRef.current = [];
        startRecording();
        onNewRecording();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (hasPermission === null) {
        return (
            <div className="text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Vérification des permissions microphone...</p>
            </div>
        );
    }

    if (hasPermission === false) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 mb-2">
                    ⚠️ Permission microphone requise
                </p>
                <p className="text-sm text-red-600 mb-3">
                    Autorisez l&apos;accès au microphone pour enregistrer l&apos;entretien
                </p>
                <button
                    onClick={checkMicrophonePermission}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            {isRecording && (
                <div className="mb-4">
                    <div className="flex items-center justify-center mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-red-600 font-medium">ENREGISTREMENT EN COURS</span>
                    </div>
                    <div className="text-2xl font-mono text-gray-700">
                        {formatDuration(duration)}
                    </div>
                    {duration >= 1200 && ( // 20 minutes
                        <p className="text-orange-600 text-sm mt-2">
                            ⚠️ Durée maximale recommandée atteinte (20 min)
                        </p>
                    )}
                </div>
            )}

            {!isRecording && !isPaused ? (
                <button
                    onClick={startRecording}
                    className="bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors text-lg font-medium flex items-center justify-center mx-auto"
                >
                    <div className="w-4 h-4 bg-white rounded-full mr-3"></div>
                    Démarrer l&apos;enregistrement
                </button>
            ) : isRecording ? (
                <button
                    onClick={pauseRecording}
                    className="bg-orange-600 text-white px-8 py-4 rounded-full hover:bg-orange-700 transition-colors text-lg font-medium flex items-center justify-center mx-auto"
                >
                    <div className="w-4 h-4 bg-white rounded-sm mr-3"></div>
                    Mettre en pause
                </button>
            ) : isPaused ? (
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <p className="text-orange-700 font-medium mb-2">
                            ⏸️ Enregistrement en pause
                        </p>
                        <p className="text-sm text-orange-600">
                            Durée actuelle : {formatDuration(duration)}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={resumeRecording}
                            className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                        >
                            <div className="w-4 h-4 bg-white rounded-full mr-3"></div>
                            Reprendre l&apos;enregistrement
                        </button>
                        <button
                            onClick={newRecording}
                            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                        >
                            <div className="w-4 h-4 bg-white rounded-full mr-3"></div>
                            Nouvel enregistrement
                        </button>
                        <button
                            onClick={finalizeRecording}
                            className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                        >
                            <div className="w-4 h-4 bg-white rounded-sm mr-3"></div>
                            Terminer
                        </button>
                    </div>
                </div>
            ) : null}

            <p className="text-sm text-gray-500 mt-4">
                Format: WebM mono 16kHz (optimisé pour la transcription)
            </p>
        </div>
    );
}
