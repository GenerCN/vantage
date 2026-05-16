import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/StyleLogin";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const manejarLogin = () => {
    // Si todo está bien, lo mandamos a la pantalla de Home
    console.log("Login exitoso con:", email);
    router.replace("/(tabs)/home");
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
        placeholder="Usuario"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={manejarLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerButtonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}
