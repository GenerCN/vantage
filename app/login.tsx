import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, StatusBar, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { authService } from "../services/authService";
import { styles } from "../styles/StyleLogin";
import { translateAuthError } from "../lib/errorHelper";

export default function LoginScreen({ onBack, onRegister }: { onBack?: () => void, onRegister?: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? "#151718" : "#ffffff";
  const titleColor = isDark ? "#ECEDEE" : "#4b4848";
  const inputBg = isDark ? "#1E2022" : "#f9f9f9";
  const inputBorderColor = isDark ? "#3E4145" : "#776f6f";
  const inputTextColor = isDark ? "#ECEDEE" : "#333333";
  const placeholderColor = isDark ? "#7E848C" : "#999999";

  const manejarLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Por favor ingresa tu nombre de usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authService.signIn(username, password);

      if (error) {
        const translatedMsg = translateAuthError(error);
        Alert.alert("Error de acceso", translatedMsg);
        console.warn("[Vantage Login Error Captured]:", error?.message || error);
      } else if (data?.session) {
        console.log("Login exitoso");
        // No necesita hacer router.replace, _layout.tsx lo hará automáticamente
      }
    } catch (err: any) {
      Alert.alert("Error", "Ocurrió un problema inesperado.");
      console.warn("[Vantage Login Exception Captured]:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === "android"
    ? (StatusBar.currentHeight || 24) + 16
    : Math.max(insets.top, 44);

  return (
    <View style={{ flex: 1, backgroundColor: containerBg, paddingTop: topPadding, paddingBottom: Math.max(insets.bottom, 20), paddingHorizontal: 20 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={containerBg} />
      
      {/* Botón de Regreso */}
      <View style={{ marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => {
            if (onBack) {
              onBack();
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
          disabled={loading}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={{ fontSize: 16, color: "#007AFF", marginLeft: 8 }}>Regresar</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido del Formulario Centrado */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Vantage Logo Premium Header */}
        <View style={{
          alignSelf: 'center',
          padding: 12,
          borderRadius: 32,
          backgroundColor: isDark ? 'rgba(46, 48, 51, 0.4)' : 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: 6,
          marginBottom: 25,
        }}>
          <Image
            source={require("../assets/images/vantage.png")}
            style={{
              width: 130,
              height: 130,
              borderRadius: 20,
            }}
            contentFit="contain"
          />
        </View>
        
        <Text style={[styles.title, { color: titleColor }]}>Iniciar Sesión</Text>

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholder="Nombre de Usuario"
          placeholderTextColor={placeholderColor}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholder="Contraseña"
          placeholderTextColor={placeholderColor}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          onPress={manejarLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => onRegister ? onRegister() : router.push("/register")}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>Crear Cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
