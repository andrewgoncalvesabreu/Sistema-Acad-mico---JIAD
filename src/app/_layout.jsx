import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Loading } from '../components/Loading';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';

const AUTH_ROUTES = ['login', 'register'];

function AuthGuard() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const inAuthRoute = AUTH_ROUTES.includes(segments[0]);

  useEffect(() => {
    if (initializing) return;

    if (!user && !inAuthRoute) {
      router.replace('/login'); // não autenticado: só vê login/cadastro
    } else if (user && inAuthRoute) {
      router.replace('/'); // autenticado: vai para a home (src/app/index.jsx)
    }
  }, [user, initializing, inAuthRoute, router]);

  if (initializing) {
    return <Loading message="Verificando sessão..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}