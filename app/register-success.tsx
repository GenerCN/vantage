import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

// Importamos nuestros nuevos estilos
import { styles } from "../styles/StyleRegisterSuccess";

export default function RegisterSuccessScreen() {
  const router = useRouter();

  // Aquí recibimos los datos que nos mandó la pantalla anterior
  const { fullName, username, password } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Registro Exitoso!</Text>

      <View style={styles.card}>
        <Text style={styles.welcomeText}>¡Bienvenido {fullName}!</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Tu usuario es:</Text>
          <Text style={styles.value}>{username}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Tu contraseña es:</Text>
          <Text style={styles.value}>{password}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(tabs)/home")} // Lo mandamos al home después del registro exitoso
      >
        <Text style={styles.buttonText}>Ir al Home</Text>
      </TouchableOpacity>
    </View>
  );
}
