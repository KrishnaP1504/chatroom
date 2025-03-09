import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define User Schema for Login
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = LoginData & { email: string };

type AuthContextType = {
  user: any;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { data: user, error, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login request:", credentials);
      const res = await apiRequest("POST", "/api/login", credentials);
const text = await res.text();
console.log("Login Response:", res.status, text);
if (!res.ok) throw new Error(text);
return JSON.parse(text);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({ title: "Logged in successfully!" });
    },
    onError: (error) => toast({ title: "Login failed", description: error.message, variant: "destructive" }),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({ title: "Registered successfully!" });
    },
    onError: (error) => toast({ title: "Registration failed", description: error.message, variant: "destructive" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({ title: "Logged out successfully!" });
    },
  });

  return (
    <AuthContext.Provider value={{ user, isLoading, error, loginMutation, logoutMutation, registerMutation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
