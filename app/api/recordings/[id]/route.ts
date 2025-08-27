import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const uploadDir = path.join(os.tmpdir(), 'vp-audio-uploads');

        // Trouver le fichier audio correspondant à cet ID (timestamp)
        const files = fs.readdirSync(uploadDir);
        const audioFile = files.find(file =>
            file.startsWith(id) && file.endsWith('.webm')
        );

        if (!audioFile) {
            return NextResponse.json(
                { error: 'Enregistrement non trouvé' },
                { status: 404 }
            );
        }

        const audioPath = path.join(uploadDir, audioFile);
        const audioBuffer = fs.readFileSync(audioPath);

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/webm',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'audio:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'audio' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const uploadDir = path.join(os.tmpdir(), 'vp-audio-uploads');

        if (!fs.existsSync(uploadDir)) {
            return NextResponse.json(
                { error: 'Dossier d\'uploads non trouvé' },
                { status: 404 }
            );
        }

        const files = fs.readdirSync(uploadDir);

        // Trouver tous les fichiers associés à cet ID (audio + metadata)
        const filesToDelete = files.filter(file => file.startsWith(id));

        if (filesToDelete.length === 0) {
            return NextResponse.json(
                { error: 'Enregistrement non trouvé' },
                { status: 404 }
            );
        }

        // Supprimer tous les fichiers associés
        let deletedFiles = 0;
        for (const file of filesToDelete) {
            try {
                const filePath = path.join(uploadDir, file);
                fs.unlinkSync(filePath);
                deletedFiles++;
            } catch (error) {
                console.error(`Erreur lors de la suppression de ${file}:`, error);
            }
        }

        if (deletedFiles === 0) {
            return NextResponse.json(
                { error: 'Impossible de supprimer l\'enregistrement' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Enregistrement supprimé avec succès',
            deletedFiles: deletedFiles
        });

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de l\'enregistrement' },
            { status: 500 }
        );
    }
}