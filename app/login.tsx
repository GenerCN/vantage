import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

import { authService } from "../services/authService";
import { styles } from "../styles/StyleLogin";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
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
        Alert.alert("Error de acceso", error.message || "Nombre de usuario o contraseña incorrectos.");
        console.error("Login error:", error);
      } else if (data?.session) {
        console.log("Login exitoso");
        // No necesita hacer router.replace, _layout.tsx lo hará automáticamente
      }
    } catch (err: any) {
      Alert.alert("Error", "Ocurrió un problema inesperado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={containerBg} />
      <Ionicons
        name="person-circle-outline"
        size={80}
        color={isDark ? "#007AFF" : "#007AFF"}
        style={styles.icon}
      />
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
        onPress={() => router.push("/register")}
        disabled={loading}
      >
        <Text style={styles.registerButtonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}
