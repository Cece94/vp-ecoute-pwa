#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers temporaires
 * Usage: node scripts/cleanup-temp.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Nettoyer les fichiers temporaires du système ET le dossier local s'il existe
const systemTempDir = os.tmpdir();
const localTempDir = path.join(process.cwd(), 'tmp');

function cleanupTempDir(dirPath, dirName) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Aucun dossier ${dirName} trouvé`);
        return 0;
    }

    const files = fs.readdirSync(dirPath);
    // Chercher les fichiers temporaires vp-audio
    const tempFiles = files.filter(file =>
        (file.startsWith('temp-') || file.startsWith('vp-audio-temp-')) && file.endsWith('.webm')
    );

    if (tempFiles.length === 0) {
        console.log(`Aucun fichier temporaire dans ${dirName}`);
        return 0;
    }

    console.log(`Nettoyage de ${tempFiles.length} fichier(s) temporaire(s) dans ${dirName}:`);

    let cleaned = 0;
    tempFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        try {
            fs.unlinkSync(filePath);
            console.log(`✓ Supprimé: ${file}`);
            cleaned++;
        } catch (error) {
            console.error(`✗ Erreur suppression ${file}:`, error.message);
        }
    });

    return cleaned;
}

function cleanupTempFiles() {
    console.log('🧹 Nettoyage des fichiers temporaires VP Audio...\n');

    let totalCleaned = 0;

    // Nettoyer le répertoire temporaire système
    totalCleaned += cleanupTempDir(systemTempDir, 'répertoire temporaire système');

    // Nettoyer le répertoire temporaire local s'il existe
    totalCleaned += cleanupTempDir(localTempDir, 'répertoire temporaire local');

    // Nettoyer le répertoire uploads dans le système temporaire
    const uploadsDir = path.join(systemTempDir, 'vp-audio-uploads');
    totalCleaned += cleanupTempDir(uploadsDir, 'répertoire uploads système');

    console.log(`\n✨ Nettoyage terminé - ${totalCleaned} fichier(s) supprimé(s)`);
}

cleanupTempFiles();
