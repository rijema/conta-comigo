import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

interface RegisterData {
  email: string;
  password: string;
  name: string;
  birthDate: string;  
  userType: string;
}

interface RegisterResponse {
  mensagem?: string;
}

export async function registerUser(data: RegisterData): Promise<RegisterResponse> {
  const response = await axios.post<RegisterResponse>(`${apiUrl}/users`, data);
  return response.data;
}
