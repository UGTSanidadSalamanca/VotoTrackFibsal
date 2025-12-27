import { User, Voter } from '../types';

export const mockUsers: User[] = [
  { username: 'Enrique', password: 'Fibsal2026', role: 'admin', center: 'Todos' },
  { username: 'Edu', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  { username: 'Marta', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  { username: 'David', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
];

export const VOTING_CENTERS = ['FIBSAL'];

// URL de Google Sheets publicada como CSV
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-HnFld2JQ1YDLHwUSA5gW7_wnraAxtTnNFF_2kJboKbKXzU-7zWNw3AhfWw8qu-MEbUZLpdsFUwt/pub?gid=1730602343&single=true&output=csv';

// URL del Google Apps Script Web App para escribir datos
// IMPORTANTE: Reemplazar con la URL real después de desplegar el script
export const SHEET_WRITE_URL = 'https://script.google.com/macros/s/AKfycbzRMrXpbaOmya_flZTLzdTe3-jcG2LcO0HCU8s9vv9Xi1xahx4JQ99vW9EUxmFm6o1r/exec';

export const voterService = {
  fetchFromSheet: async (url: string): Promise<Voter[]> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al descargar el archivo de Google Sheets');
      const csvText = await response.text();

      const PapaModule = await import('https://esm.sh/papaparse@5.4.1');
      const Papa = PapaModule.default || PapaModule;

      return new Promise((resolve, reject) => {
        if (typeof Papa.parse !== 'function') {
          reject(new Error('Librería de procesamiento no disponible.'));
          return;
        }

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: (header: string) => header.trim().toLowerCase(), // Normaliza encabezados a minúsculas
          complete: (results: any) => {
            const voters: Voter[] = results.data.map((row: any) => ({
              id: Number(row.id || 0),
              nombre: String(row.nombre || ''),
              apellido: String(row.apellido || ''),
              apellido2: String(row.apellido2 || ''),
              telefono: String(row.telefono || ''),
              email: String(row.email || ''),
              afiliadoUGT: String(row.afiliadougt || '').toLowerCase() === 'si' || row.afiliadougt === true,
              haVotado: String(row.havotado || '').toLowerCase() === 'si' || row.havotado === true,
              horaVoto: row.horavoto || null,
              centroVotacion: row.centrovotacion || 'FIBSAL',
              mesaVotacion: row.mesavotacion || 'Mesa 1',
            }));
            resolve(voters);
          },
          error: (error: any) => reject(error)
        });
      });
    } catch (error) {
      console.error('VoterService Error:', error);
      throw error;
    }
  },
  updateVoterStatus: async (voterId: number, hasVoted: boolean): Promise<{ success: boolean; horaVoto: string | null; error?: string }> => {
    const horaVoto = hasVoted ? new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null;

    try {
      // Usar no-cors para evitar problemas de CORS con Google Apps Script
      // Nota: Con no-cors no podemos leer la respuesta, pero el script se ejecutará
      await fetch(SHEET_WRITE_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante: evita bloqueo de CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterId,
          hasVoted,
          horaVoto
        })
      });

      // Con no-cors, asumimos que la petición fue exitosa
      // El script de Google se ejecutará en segundo plano
      console.log('Petición enviada a Google Sheets');
      return { success: true, horaVoto };

    } catch (error) {
      console.error('Error al actualizar Google Sheet:', error);
      // Incluso con error de red, actualizamos localmente
      return {
        success: true,
        horaVoto,
        error: 'Actualizado localmente. Verifica la conexión con Google Sheets'
      };
    }
  },
  sendReminder: (voterId: number): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        alert(`Recordatorio enviado al votante con ID: ${voterId}`);
        resolve({ success: true });
      }, 300);
    });
  },
  sendMassReminder: (voterIds: number[]): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        alert(`Recordatorio masivo enviado a ${voterIds.length} afiliados.`);
        resolve({ success: true });
      }, 800);
    });
  }
};

export const mockVoters: Voter[] = [];
