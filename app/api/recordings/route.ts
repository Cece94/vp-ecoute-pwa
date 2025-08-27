import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface RecordingFile {
    id: string;
    filename: string;
    participant: string;
    commune: string;
    timestamp: string;
    size: number;
    duration?: number;
    metadata?: any;
}

export async function GET() {
    try {
        // Chemin vers le dossier des uploads locaux
        const uploadDir = path.join(os.tmpdir(), 'vp-audio-uploads');

        if (!fs.existsSync(uploadDir)) {
            return NextResponse.json({ recordings: [] });
        }

        const files = fs.readdirSync(uploadDir);
        const recordings: RecordingFile[] = [];

        // Grouper les fichiers par timestamp
        const fileGroups: { [key: string]: { audio?: string; metadata?: string } } = {};

        files.forEach(file => {
            const timestampMatch = file.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
            if (timestampMatch) {
                const timestamp = timestampMatch[1];
                if (!fileGroups[timestamp]) {
                    fileGroups[timestamp] = {};
                }

                if (file.endsWith('.webm')) {
                    fileGroups[timestamp].audio = file;
                } else if (file.endsWith('metadata.json')) {
                    fileGroups[timestamp].metadata = file;
                }
            }
        });

        // Traiter chaque groupe pour créer les entrées d'enregistrement
        Object.entries(fileGroups).forEach(([timestamp, group]) => {
            if (group.audio && group.metadata) {
                try {
                    const metadataPath = path.join(uploadDir, group.metadata);
                    const audioPath = path.join(uploadDir, group.audio);

                    const metadataContent = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    const audioStats = fs.statSync(audioPath);

                    recordings.push({
                        id: timestamp,
                        filename: group.audio,
                        participant: `${metadataContent.prenom} ${metadataContent.nom}`,
                        commune: metadataContent.commune,
                        timestamp: metadataContent.timestamp || timestamp,
                        size: audioStats.size,
                        metadata: metadataContent
                    });
                } catch (error) {
                    console.error(`Erreur lors du traitement du fichier ${group.metadata}:`, error);
                }
            }
        });

        // Trier par timestamp décroissant (plus récent en premier)
        recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({ recordings });

    } catch (error) {
        console.error('Erreur lors de la récupération des enregistrements:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des enregistrements' },
            { status: 500 }
        );
    }
}
