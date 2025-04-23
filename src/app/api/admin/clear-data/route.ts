import { NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Vérification de sécurité pour éviter les nettoyages accidentels
    if (!body.confirm) {
      return NextResponse.json(
        { success: false, message: 'Confirmation requise pour supprimer les données' },
        { status: 400 }
      );
    }
    
    // Chemin vers le script de nettoyage
    const scriptPath = path.resolve(process.cwd(), 'server/scripts/clear-data.js');
    
    // Exécution du script de nettoyage des données
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    
    if (stderr) {
      console.error('Erreur lors du nettoyage:', stderr);
      return NextResponse.json(
        { success: false, message: 'Erreur lors du nettoyage des données', error: stderr },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Toutes les données ont été effacées avec succès',
      details: stdout
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue', error: error.message },
      { status: 500 }
    );
  }
}
