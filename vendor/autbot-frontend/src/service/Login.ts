import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function loginUser(data: LoginData): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${apiUrl}/login`, data);
  console.log("Login response:", response.data);
  return response.data;
}
