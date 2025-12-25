
export interface Voter {
  id: number;
  nombre: string;
  apellido: string;
  apellido2: string;
  telefono: string;
  email: string;
  afiliadoUGT: boolean;
  haVotado: boolean;
  horaVoto: string | null;
  centroVotacion: string;
  mesaVotacion: string;
}

export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'mesa';
  center: string;
}
