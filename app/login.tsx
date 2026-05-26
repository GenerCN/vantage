import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { authService } from "../services/authService";
import { styles } from "../styles/StyleLogin";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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
    <View style={styles.container}>
      <Ionicons
        name="person-circle-outline"
        size={80}
        color="#007AFF"
        style={styles.icon}
      />
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre de Usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
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
