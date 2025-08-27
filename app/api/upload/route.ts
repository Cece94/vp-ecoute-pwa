import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

interface TempFile {
    filepath: string;
    originalFilename: string;
    mimetype: string;
}

interface ParticipantMetadata {
    nom: string;
    prenom: string;
    commune: string;
    email: string;
    telephone: string;
}

interface GCSConfig {
    storage: Storage;
    bucketName: string;
}

// Configuration GCS
const initGCS = () => {
    const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY_BASE64;
    const bucketName = process.env.GCS_BUCKET;

    if (!serviceAccountKey || !bucketName) {
        return null;
    }

    try {
        const keyFile = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString());
        const storage = new Storage({
            credentials: keyFile,
            projectId: keyFile.project_id,
        });

        return { storage, bucketName };
    } catch (error) {
        console.error('Erreur configuration GCS:', error);
        return null;
    }
};

// Fonction pour sauvegarder localement (fallback)
const saveLocally = async (file: TempFile, metadata: ParticipantMetadata) => {
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}-${metadata.prenom}-${metadata.nom}.webm`;
    const filePath = path.join(uploadDir, fileName);

    // Déplacer le fichier au lieu de le copier (évite la duplication)
    fs.renameSync(file.filepath, filePath);

    // Sauvegarder les métadonnées
    const metadataPath = path.join(uploadDir, `${timestamp}-metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify({
        ...metadata,
        fileName,
        timestamp,
        consent: true,
        consentTimestamp: new Date().toISOString()
    }, null, 2));

    return {
        success: true,
        url: `/tmp/uploads/${fileName}`,
        message: 'Fichier sauvegardé localement (mode démo)'
    };
};

// Fonction pour uploader vers GCS
const uploadToGCS = async (file: TempFile, metadata: ParticipantMetadata, gcsConfig: GCSConfig) => {
    const { storage, bucketName } = gcsConfig;
    const bucket = storage.bucket(bucketName);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `entretiens/${timestamp}-${metadata.prenom}-${metadata.nom}.webm`;
    const metadataFileName = `entretiens/${timestamp}-metadata.json`;

    try {
        // Upload du fichier audio
        await bucket.upload(file.filepath, {
            destination: fileName,
            metadata: {
                contentType: 'audio/webm',
                metadata: {
                    source: 'vp-ecoute-app',
                    participant: `${metadata.prenom} ${metadata.nom}`,
                    commune: metadata.commune,
                    timestamp
                }
            }
        });

        // Upload des métadonnées
        const metadataContent = JSON.stringify({
            ...metadata,
            fileName,
            timestamp,
            consent: true,
            consentTimestamp: new Date().toISOString()
        }, null, 2);

        const metadataFile = bucket.file(metadataFileName);
        await metadataFile.save(metadataContent, {
            metadata: { contentType: 'application/json' }
        });

        // Nettoyage du fichier temporaire
        fs.unlinkSync(file.filepath);

        return {
            success: true,
            url: `gs://${bucketName}/${fileName}`,
            metadataUrl: `gs://${bucketName}/${metadataFileName}`,
            message: 'Fichier uploadé avec succès vers GCS'
        };
    } catch (error) {
        console.error('Erreur upload GCS:', error);
        throw error;
    }
};

export async function POST(request: NextRequest) {
    try {
        // Parse form data
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const metadataJson = formData.get('metadata') as string;

        if (!audioFile || !metadataJson) {
            return NextResponse.json(
                { error: 'Fichier audio et métadonnées requis' },
                { status: 400 }
            );
        }

        const metadata = JSON.parse(metadataJson);

        // Validation des champs requis
        const requiredFields = ['nom', 'prenom', 'commune', 'email', 'telephone'];
        for (const field of requiredFields) {
            if (!metadata[field]) {
                return NextResponse.json(
                    { error: `Champ requis manquant: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Créer un fichier temporaire
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, `temp-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, buffer);

        const tempFile = {
            filepath: tempFilePath,
            originalFilename: audioFile.name,
            mimetype: audioFile.type
        };

        // Tenter l'upload GCS, sinon fallback local
        const gcsConfig = initGCS();

        let result;
        if (gcsConfig) {
            try {
                result = await uploadToGCS(tempFile, metadata, gcsConfig);
            } catch (error) {
                console.error('Échec upload GCS, fallback local:', error);
                result = await saveLocally(tempFile, metadata);
            }
        } else {
            console.log('Variables GCS non configurées, sauvegarde locale');
            result = await saveLocally(tempFile, metadata);
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erreur upload:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'upload' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'API VP Écoute - Endpoint d\'upload audio',
        version: '1.0.0'
    });
}
