import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, LogBox } from "react-native";
import "react-native-reanimated";

// Ignorar alertas y popups del LogBox molestos en desarrollo
LogBox.ignoreLogs([
  "AuthApiError: Invalid Refresh Token",
]);

import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#151718",
  },
};

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Verificar sesión inicial de forma segura
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setInitialized(true);
      })
      .catch((err) => {
        console.log("⚠️ [LogBox-safe] Error al recuperar sesión de Supabase:", err);
        setSession(null);
        setInitialized(true);
      });

    // Escuchar cambios en la sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const currentScreen = segments[0];
    const inAuthGroup = currentScreen === "(tabs)";
    const inLoginFlow = currentScreen === "login" || currentScreen === "register" || currentScreen === "register-success";
    const inWelcome = !currentScreen;

    if (!session) {
      // Sin sesión: permitir index, login, register, register-success
      // Redirigir (tabs) al index (bienvenida)
      if (inAuthGroup) {
        router.replace("/");
      }
    } else {
      // Con sesión: redirigir login/register a home
      if (inLoginFlow || inWelcome) {
        router.replace("/(tabs)/home");
      }
    }
  }, [session, segments, initialized]);

  if (!initialized) {
    const loaderBg = colorScheme === 'dark' ? "#151718" : "#ffffff";
    const spinnerColor = colorScheme === 'dark' ? "#14B8A6" : "#007AFF";
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: loaderBg }}>
        <ActivityIndicator size="large" color={spinnerColor} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <Stack screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: colorScheme === 'dark' ? '#151718' : '#ffffff' } 
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="register-success" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
