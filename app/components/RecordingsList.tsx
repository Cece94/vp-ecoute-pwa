'use client';

import { useState, useEffect } from 'react';

interface Recording {
    id: string;
    filename: string;
    participant: string;
    commune: string;
    timestamp: string;
    size: number;
    metadata?: any;
}

interface RecordingsListProps {
    onRefresh?: () => void;
}

export default function RecordingsList({ onRefresh }: RecordingsListProps) {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const fetchRecordings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/recordings');
            const data = await response.json();

            if (response.ok) {
                setRecordings(data.recordings);
                setError(null);
            } else {
                setError(data.error || 'Erreur lors du chargement');
            }
        } catch (err) {
            setError('Erreur de connexion');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecordings();
    }, []);

    const formatDate = (timestamp: string) => {
        try {
            // Le timestamp est au format: 2025-08-27T10-19-49-154Z
            // On doit le convertir au format ISO standard: 2025-08-27T10:19:49.154Z
            let isoString = timestamp;

            // Si c'est le format avec des tirets dans l'heure
            if (timestamp.includes('T') && timestamp.includes('-', 11)) {
                const parts = timestamp.split('T');
                const datePart = parts[0]; // 2025-08-27
                const timePart = parts[1].replace('Z', ''); // 10-19-49-154

                // Convertir 10-19-49-154 en 10:19:49.154
                const timeComponents = timePart.split('-');
                if (timeComponents.length >= 3) {
                    const hour = timeComponents[0];
                    const minute = timeComponents[1];
                    const second = timeComponents[2];
                    const millisecond = timeComponents[3] || '000';

                    isoString = `${datePart}T${hour}:${minute}:${second}.${millisecond}Z`;
                }
            }

            const date = new Date(isoString);

            // Vérifier si la date est valide
            if (isNaN(date.getTime())) {
                // Si la conversion échoue, essayer de parser directement
                const fallbackDate = new Date(timestamp);
                if (isNaN(fallbackDate.getTime())) {
                    return 'Date invalide';
                }
                return fallbackDate.toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            return date.toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erreur formatage date:', error, 'Timestamp:', timestamp);
            return 'Date invalide';
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handlePlay = (recordingId: string) => {
        if (playingId === recordingId) {
            setPlayingId(null);
        } else {
            setPlayingId(recordingId);
        }
    };

    const handleRefresh = () => {
        fetchRecordings();
        onRefresh?.();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600">Chargement des enregistrements...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="text-red-600 mb-4">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm sm:text-base">{error}</span>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (recordings.length === 0) {
        return (
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun enregistrement</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">Il n&apos;y a pas encore d&apos;enregistrements sauvegardés.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                    Actualiser
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Enregistrements sauvegardés ({recordings.length})
                </h3>
                <button
                    onClick={handleRefresh}
                    className="px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors self-start sm:self-auto"
                >
                    ↻ Actualiser
                </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {recordings.map((recording) => (
                    <div
                        key={recording.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                    <button
                                        onClick={() => handlePlay(recording.id)}
                                        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors play-button"
                                    >
                                        {playingId === recording.id ? (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                            {recording.participant}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {recording.commune} • {formatDate(recording.timestamp)}
                                        </p>
                                    </div>
                                </div>

                                {playingId === recording.id && (
                                    <div className="mt-2 sm:mt-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                                        <audio
                                            controls
                                            className="w-full h-8 sm:h-10"
                                            src={`/api/recordings/${recording.id}`}
                                            onEnded={() => setPlayingId(null)}
                                        >
                                            Votre navigateur ne supporte pas la lecture audio.
                                        </audio>
                                    </div>
                                )}
                            </div>

                            <div className="text-right text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                <div>{formatSize(recording.size)}</div>
                                {recording.metadata?.email && (
                                    <div className="mt-1 text-xs text-gray-400 truncate max-w-24 sm:max-w-32">
                                        {recording.metadata.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {recording.metadata && (
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs text-gray-600">
                                    {recording.metadata.telephone && (
                                        <div className="truncate">
                                            <span className="font-medium">Tél:</span> {recording.metadata.telephone}
                                        </div>
                                    )}
                                    <div className="truncate">
                                        <span className="font-medium">Fichier:</span> {recording.filename}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
