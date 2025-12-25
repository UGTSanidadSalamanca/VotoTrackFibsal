
import { User, Voter } from '../types';

export const mockUsers: User[] = [
  { username: 'admin', password: 'admin', role: 'admin', center: 'Todos' },
  { username: 'mesa1', password: 'mesa1', role: 'mesa', center: 'FIBSAL' },
];

export const VOTING_CENTERS = ['FIBSAL'];

// URL de Google Sheets publicada como CSV
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-HnFld2JQ1YDLHwUSA5gW7_wnraAxtTnNFF_2kJboKbKXzU-7zWNw3AhfWw8qu-MEbUZLpdsFUwt/pub?gid=1730602343&single=true&output=csv';

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
          transformHeader: (header: string) => header.trim().toLowerCase(),
          complete: (results: any) => {
            const voters: Voter[] = results.data.map((row: any) => {
              // Confiamos en el ID que viene del CSV ahora que ha sido corregido
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
  updateVoterStatus: (voterId: number, hasVoted: boolean): Promise<{ success: boolean; horaVoto: string | null }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ 
            success: true, 
            horaVoto: hasVoted ? new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null 
        });
      }, 300);
    });
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
