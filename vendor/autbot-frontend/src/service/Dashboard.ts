import axios from "axios";

// CORREÇÃO: Definindo o endereço do seu backend aqui
const apiUrl = "http://localhost:3000/api";

export interface DashboardReponse {
  totalUsuarios: number;
  totalChats: number;
  mensagensEnviadas: number; 
  usuariosAtivosHoje: number; 
}

export async function getDashboardStats(): Promise<DashboardReponse> {
  // Agora a variável apiUrl existe
  const response = await axios.get(`${apiUrl}/dashboard`);
  return response.data;
}