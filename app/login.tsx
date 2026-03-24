import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/StyleLogin";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const manejarLogin = () => {
    // Validamos que los campos no estén vacíos
    if (email === "" || password === "") {
      Alert.alert("Error", "Por favor ingresa datos en ambos campos.");
      return;
    }

    // Si todo está bien, lo mandamos a la pantalla de Home
    console.log("Login exitoso con:", email);
    router.replace("/home");
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
    </View>
  );
}
