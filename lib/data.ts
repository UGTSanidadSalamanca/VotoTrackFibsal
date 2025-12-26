
import { User, Voter } from '../types';

export const mockUsers: User[] = [
  { username: 'admin', password: 'admin', role: 'admin', center: 'Todos' },
  { username: 'Enrique', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  { username: 'Edu', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  // Fix: changed 'mesa1' to 'mesa' to comply with User['role'] type
  { username: 'Marta', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  // Fix: changed 'mesa1' to 'mesa' to comply with User['role'] type
  { username: 'David', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
];

export const VOTING_CENTERS = ['FIBSAL'];

// --- CONFIGURACIÓN DE MENSAJES DE RECORDATORIO ---
// Puedes editar estos textos libremente. 
// Usa {{nombre}} para insertar el nombre del votante.
export const REMINDER_TEMPLATES = {
  individual: "Hola {{nombre}}, te recordamos que hoy se celebran las elecciones en FIBSAL. Tu participación es fundamental. ¡Te esperamos en tu mesa electoral!",
  mass: "Recordatorio de elecciones FIBSAL: Hola {{nombre}}, aún no hemos registrado tu voto. Te animamos a participar antes del cierre de urnas. ¡Gracias!"
};

// URL de Google Sheets publicada como CSV (para lectura rápida)
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-HnFld2JQ1YDLHwUSA5gW7_wnraAxtTnNFF_2kJboKbKXzU-7zWNw3AhfWw8qu-MEbUZLpdsFUwt/pub?gid=1730602343&single=true&output=csv';

// URL del Google Apps Script desplegado como Web App (para escritura)
export const SHEET_SCRIPT_URL = ''; 

export const voterService = {
  fetchFromSheet: async (url: string): Promise<Voter[]> => {
    try {
      const response = await fetch(`${url}&t=${Date.now()}`);
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
          transformHeader: (header: string) => header.trim().toLowerCase(),
          complete: (results: any) => {
            const voters: Voter[] = results.data.map((row: any) => {
              const rowId = Number(row.id);
              return {
                id: rowId,
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
              };
            });
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
  
  updateVoterStatus: async (voterId: number, hasVoted: boolean): Promise<{ success: boolean; horaVoto: string | null }> => {
    const hora = hasVoted ? new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null;
    
    if (!SHEET_SCRIPT_URL) {
      console.warn('SHEET_SCRIPT_URL no configurada.');
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true, horaVoto: hora }), 300);
      });
    }

    try {
      await fetch(SHEET_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: voterId, status: hasVoted, time: hora })
      });
      return { success: true, horaVoto: hora };
    } catch (error) {
      return { success: false, horaVoto: null };
    }
  },
  
  sendReminder: (voter: Voter): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
      const message = REMINDER_TEMPLATES.individual.replace('{{nombre}}', voter.nombre);
      setTimeout(() => {
        alert(`SIMULACIÓN DE ENVÍO A ${voter.telefono}:\n\n"${message}"`);
        resolve({ success: true });
      }, 300);
    });
  },
  
  sendMassReminder: (voters: Voter[]): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        alert(`Se han generado ${voters.length} mensajes de recordatorio masivo basados en la plantilla.`);
        resolve({ success: true });
      }, 800);
    });
  }
};

export const mockVoters: Voter[] = [];
