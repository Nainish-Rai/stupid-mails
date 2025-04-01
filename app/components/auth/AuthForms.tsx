"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AuthFormsProps {
  defaultView?: "signin" | "signup";
}

// Define validation schemas
const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export function AuthForms({ defaultView = "signin" }: AuthFormsProps) {
  const [view, setView] = useState<"signin" | "signup">(defaultView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize forms with React Hook Form + Zod
  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: SignInFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn.email(
        {
          email: data.email,
          password: data.password,
          callbackURL: "/dashboard",
          rememberMe: true,
        },
        {
          onSuccess: () => {
            // Handled by the callback URL
          },
          onError: (ctx) => {
            handleAuthError(ctx.error.message);
          },
        }
      );

      if (error) {
        handleAuthError(error.message || "An error occurred during sign in");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
          callbackURL: "/dashboard",
        },
        {
          onSuccess: () => {
            // Handled by the callback URL
          },
          onError: (ctx) => {
            handleAuthError(ctx.error.message);
          },
        }
      );

      if (error) {
        handleAuthError(error.message || "An error occurred during sign up");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle auth errors and map them to form fields when possible
  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);

    // Map common error messages to specific form fields
    if (view === "signin") {
      if (errorMessage.toLowerCase().includes("email")) {
        signInForm.setError("email", { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes("password")) {
        signInForm.setError("password", { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes("credentials")) {
        signInForm.setError("email", { message: "Invalid credentials" });
        signInForm.setError("password", { message: "Invalid credentials" });
      }
    } else {
      if (errorMessage.toLowerCase().includes("email")) {
        signUpForm.setError("email", { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes("password")) {
        signUpForm.setError("password", { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes("name")) {
        signUpForm.setError("name", { message: errorMessage });
      }
    }
  };

  const handleSocialSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "google", // Explicitly using 'google' as it's configured in auth.ts
        callbackURL: "/dashboard",
        errorCallbackURL: "/auth/error",
      });
    } catch (err) {
      setError("An unexpected error occurred with social sign-in");
      setIsLoading(false);
      console.error(err);
    }
  };

  // Reset errors when switching views
  const switchView = (newView: "signin" | "signup") => {
    setView(newView);
    setError(null);
    signInForm.reset();
    signUpForm.reset();
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-none shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {view === "signin" ? "Sign In" : "Create an Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {view === "signin"
              ? "Enter your credentials to sign in to your account"
              : "Fill out the form below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {view === "signin" ? (
              <motion.div
                key="signin"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form {...signInForm}>
                  <form
                    onSubmit={signInForm.handleSubmit(handleSignIn)}
                    className="space-y-4"
                  >
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="name@example.com"
                              type="email"
                              autoComplete="email"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              autoComplete="current-password"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form {...signUpForm}>
                  <form
                    onSubmit={signUpForm.handleSubmit(handleSignUp)}
                    className="space-y-4"
                  >
                    <FormField
                      control={signUpForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              autoComplete="name"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="name@example.com"
                              type="email"
                              autoComplete="email"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              autoComplete="new-password"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={handleSocialSignIn}
                disabled={isLoading}
                className="w-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="mr-2 h-4 w-4"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                Google
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <motion.p
            className="text-center text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {view === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() =>
                switchView(view === "signin" ? "signup" : "signin")
              }
            >
              {view === "signin" ? "Sign up" : "Sign in"}
            </Button>
          </motion.p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
