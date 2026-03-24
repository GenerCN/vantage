import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/StyleIndex";

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
