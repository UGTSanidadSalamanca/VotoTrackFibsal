
import { User, Voter } from '../types';

export const mockUsers: User[] = [
  { username: 'admin', password: 'admin', role: 'admin', center: 'Todos' },
  { username: 'Enrique', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  { username: 'Edu', password: 'Fibsal2026', role: 'admin', center: 'FIBSAL' },
  { username: 'Marta', password: 'Fibsal2026', role: 'mesa1', center: 'FIBSAL' },
  { username: 'David', password: 'Fibsal2026', role: 'mesa1', center: 'FIBSAL' },
];

export const VOTING_CENTERS = ['FIBSAL'];

// URL de Google Sheets publicada como CSV (para lectura rápida)
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-HnFld2JQ1YDLHwUSA5gW7_wnraAxtTnNFF_2kJboKbKXzU-7zWNw3AhfWw8qu-MEbUZLpdsFUwt/pub?gid=1730602343&single=true&output=csv';

// URL del Google Apps Script desplegado como Web App (para escritura)
// DEBES PEGAR AQUÍ TU URL DE DESPLIEGUE (debería empezar por https://script.google.com/macros/s/...)
export const SHEET_SCRIPT_URL = ''; 

export const voterService = {
  fetchFromSheet: async (url: string): Promise<Voter[]> => {
    try {
      const response = await fetch(`${url}&t=${Date.now()}`); // Añadimos timestamp para evitar caché
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
    
    // Si no hay URL del script configurada, solo actualizamos localmente (mock)
    if (!SHEET_SCRIPT_URL) {
      console.warn('SHEET_SCRIPT_URL no configurada. La actualización será solo local.');
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true, horaVoto: hora }), 300);
      });
    }

    try {
      // Intentamos actualizar la hoja de Google real
      const response = await fetch(SHEET_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Necesario para Google Apps Script por redirecciones
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: voterId,
          status: hasVoted,
          time: hora
        })
      });

      // Nota: Con 'no-cors' no podemos leer la respuesta JSON, 
      // pero si el fetch no lanza error, asumimos éxito.
      return { success: true, horaVoto: hora };
      
    } catch (error) {
      console.error('Error al sincronizar con Google Sheets:', error);
      alert('Error de conexión con la hoja de cálculo. El cambio se verá solo en esta sesión.');
      return { success: false, horaVoto: null };
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
