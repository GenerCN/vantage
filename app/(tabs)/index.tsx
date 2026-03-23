import { Ionicons } from "@expo/vector-icons"; // Importamos los iconos de Expo
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/dashboard_24dp_000000.svg")}
        style={[styles.mainIcon, { width: 80, height: 80 }]}
        contentFit="contain"
      />
      <Text style={styles.title}>¡Bienvenido a VANTAGE!</Text>
      <Text style={styles.subtitle}>
        {" "}
        Seleccione la opción que te gustaría hacer hoy
      </Text>

      {/* Botón de Iniciar Sesión */}
      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={() => router.push("/login")}
      >
        <Ionicons name="log-in-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      {/* Botón de Registrarse */}
      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={() => router.push("/register")}
      >
        <Ionicons name="person-add-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  mainIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    justifyContent: "center",
    fontWeight: "bold",
    color: "#151414",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    justifyContent: "center",
    textAlign: "center",
    color: "#151414",
    marginBottom: 40,
  },
  button: {
    flexDirection: "row", // Esto pone el icono y el texto uno al lado del otro
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 55,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3, // Da una pequeña sombra en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loginButton: {
    backgroundColor: "#007AFF", // Azul llamativo
  },
  registerButton: {
    backgroundColor: "#34C759", // Verde llamativo
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10, // Separa un poco el texto del icono
  },
});
