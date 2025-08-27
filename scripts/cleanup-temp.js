#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers temporaires
 * Usage: node scripts/cleanup-temp.js
 */

const fs = require('fs');
const path = require('path');

const tempDir = path.join(process.cwd(), 'tmp');

function cleanupTempFiles() {
    if (!fs.existsSync(tempDir)) {
        console.log('Aucun dossier tmp trouvé');
        return;
    }

    const files = fs.readdirSync(tempDir);
    const tempFiles = files.filter(file => file.startsWith('temp-') && file.endsWith('.webm'));

    if (tempFiles.length === 0) {
        console.log('Aucun fichier temporaire à nettoyer');
        return;
    }

    console.log(`Nettoyage de ${tempFiles.length} fichier(s) temporaire(s):`);

    tempFiles.forEach(file => {
        const filePath = path.join(tempDir, file);
        try {
            fs.unlinkSync(filePath);
            console.log(`✓ Supprimé: ${file}`);
        } catch (error) {
            console.error(`✗ Erreur suppression ${file}:`, error.message);
        }
    });

    console.log('Nettoyage terminé');
}

cleanupTempFiles();
