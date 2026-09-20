import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export interface DashboardReponse {
  totalUsuarios: number;
  totalChats: number;
  mensagensEnviadas: number; 
  usuariosAtivosHoje: number; 
}

export async function getDashboardStats(): Promise<DashboardReponse> {
  const response = await axios.get(`${apiUrl}/dashboard`);
  return response.data;
}