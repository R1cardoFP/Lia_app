import api from "@/services/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

// Tipo exato com base no teu modelo Laravel
type User = {
  id: number;
  name: string;
  email: string;
  phone: string | number;
  n_aluno?: string | null;
  curso?: string | null;
  user_type_id: number;
  user_status_id: number;
  image?: string | null;
};

type AuthContextType = {
  isLoggedIn: boolean;
  isReady: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // Útil para atualizar os dados após editar o perfil
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone: string;
  student_number?: string;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        
        if (token) {
          const response = await api.get("/me");
          setUser(response.data);
        }
      } catch (err) {
        console.log("Erro ao validar sessão anterior:", err);
        await SecureStore.deleteItemAsync("authToken");
        setUser(null);
      } finally {
        setIsReady(true);
      }
    }

    loadUser();
  }, []);

  async function login(email: string, password: string) {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      if (response.data.status === "success") {
        const { token, user: userResponse } = response.data;
        
        // Guarda o token de forma criptografada
        await SecureStore.setItemAsync("authToken", token);
        setUser(userResponse);
        
        router.replace("/(protected)/(tabs)/catalogo");
      }
    } catch (err: any) {
      console.log("Erro no login:", err.response?.data || err.message);
      throw err;
    }
  }

  async function register(data: RegisterData) {
    try {
      // Bate na tua rota exata: POST /register
      const response = await api.post("/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        student_number: data.student_number, // Mapeado para o teu validador Laravel
      });

      if (response.data.status === "success") {
        const { token, user: userResponse } = response.data;
        
        await SecureStore.setItemAsync("authToken", token);
        setUser(userResponse);
        
        router.replace("/(protected)/(tabs)/catalogo");
      }
    } catch (err: any) {
      console.log("Erro no registo:", err.response?.data || err.message);
      throw err;
    }
  }

  async function logout() {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      // Avisa o Laravel que o token foi revogado (POST /logout)
      await api.post("/logout", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.log("Erro ao revogar token no backend:", err);
    } finally {
      // Limpa os dados locais independentemente de a API falhar ou não
      await SecureStore.deleteItemAsync("authToken");
      setUser(null);
      router.replace("/login");
    }
  }

  // Função auxiliar para re-buscar os dados do utilizador (ex: após mudar foto)
  async function refreshUser() {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        const response = await api.get("/me");
        setUser(response.data);
      }
    } catch (err) {
      console.log("Erro ao atualizar dados do utilizador:", err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        isReady,
        user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

