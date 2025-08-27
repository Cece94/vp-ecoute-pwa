'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
}

export default function AudioRecorder({
    onRecordingComplete,
    isRecording,
    onStartRecording,
    onStopRecording
}: AudioRecorderProps) {
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

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
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);

                // Nettoyage
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start(1000); // Collecte de données chaque seconde
            onStartRecording();

            // Démarrer le compteur
            setDuration(0);
            intervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Erreur démarrage enregistrement:', error);
            setHasPermission(false);
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

            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors text-lg font-medium flex items-center justify-center mx-auto"
                >
                    <div className="w-4 h-4 bg-white rounded-full mr-3"></div>
                    Démarrer l&apos;enregistrement
                </button>
            ) : (
                <button
                    onClick={stopRecording}
                    className="bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors text-lg font-medium flex items-center justify-center mx-auto"
                >
                    <div className="w-4 h-4 bg-white rounded-sm mr-3"></div>
                    Arrêter l&apos;enregistrement
                </button>
            )}

            <p className="text-sm text-gray-500 mt-4">
                Format: WebM mono 16kHz (optimisé pour la transcription)
            </p>
        </div>
    );
}
