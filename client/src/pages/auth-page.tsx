import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to Chatroom</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="hidden md:flex items-center justify-center bg-primary/5 p-8">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Join the conversation</h2>
          <p className="text-muted-foreground">
            Connect with others in real-time through our simple and intuitive chat platform.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();

  const loginSchema = insertUserSchema.pick({ username: true, password: true });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
      defaultValues: {
      username: "",
      password: "",
      },
    });

  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          console.log("Login Request:", data);
          loginMutation.mutate(data, {
            onError: (error) => console.error("Login Failed:", error.message),
          });
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="username">Username</Label>
              <FormControl>
              <Input id="username"{...field} placeholder="Enter username" />
              </FormControl>
            <FormMessage />
        </FormItem>
      )}
    />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="password">Password</Label>
              <FormControl>
                <Input id="password" type="password" {...field} />
              </FormControl>
            <FormMessage />
        </FormItem>
      )}
    />
    {loginMutation.error && <p className="text-red-500">{loginMutation.error.message}</p>}
    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Login
    </Button>
  </form>
  </Form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();

  const form = useForm<{ username: string; email: string; password: string }>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="register-username">Username</Label>
              <FormControl>
                <Input id="register-username"  {...field} />
              </FormControl>
            <FormMessage />
        </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="register-email">Email</Label>
              <FormControl>
                <Input id="register-email"  type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}        
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="register-password">Password</Label>
              <FormControl>
                <Input id="register-password"  type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register
        </Button>
      </form>
    </Form>
  );
}
