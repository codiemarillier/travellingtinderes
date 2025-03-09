import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UserProfile } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => apiRequest('POST', '/api/auth/login', data),
    onSuccess: async (response) => {
      const userData = await response.json();
      onLogin(userData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) => apiRequest('POST', '/api/auth/register', data),
    onSuccess: async (response) => {
      const userData = await response.json();
      onLogin(userData);
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: "Username or email may already be in use. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit login form
  const onSubmitLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Submit register form
  const onSubmitRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading text-dark mb-2">
            <span className="text-primary">Swipe</span>Trip
          </h1>
          <p className="text-gray-600">Discover your next adventure</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue your travel journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab('register')}
                  >
                    Register now
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Join SwipeTrip to discover amazing destinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab('login')}
                  >
                    Sign in
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
