import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler, StatusBar, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importamos nuestros nuevos estilos
import { styles } from "../styles/StyleRegisterSuccess";

export default function RegisterSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Aquí recibimos los datos que nos mandó la pantalla anterior
  const { fullName, username, password } = useLocalSearchParams();

  // Interceptar botón de atrás físico en Android para ir al home en vez de crashear por falta de historial
  useEffect(() => {
    const backAction = () => {
      router.replace("/(tabs)/home");
      return true; // Bloquea la acción por defecto
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? "#151718" : "#f4f4f9";
  const titleColor = isDark ? "#ECEDEE" : "#333333";
  const cardBg = isDark ? "#1E2022" : "#ffffff";
  const welcomeColor = isDark ? "#2DD4BF" : "#007AFF";
  const infoBoxBg = isDark ? "#2E3033" : "#f9f9f9";
  const infoBoxBorder = isDark ? "#3E4145" : "#eeeeee";
  const labelColor = isDark ? "#9BA1A6" : "#666666";
  const valueColor = isDark ? "#ECEDEE" : "#333333";

  return (
    <View style={[styles.container, { backgroundColor: containerBg, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={containerBg} />
      <Text style={[styles.title, { color: titleColor }]}>¡Registro Exitoso!</Text>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.welcomeText, { color: welcomeColor }]}>¡Bienvenido {fullName}!</Text>

        <View style={[styles.infoBox, { backgroundColor: infoBoxBg, borderColor: infoBoxBorder }]}>
          <Text style={[styles.label, { color: labelColor }]}>Tu usuario es:</Text>
          <Text style={[styles.value, { color: valueColor }]}>{username}</Text>
        </View>

        <View style={[styles.infoBox, { backgroundColor: infoBoxBg, borderColor: infoBoxBorder }]}>
          <Text style={[styles.label, { color: labelColor }]}>Tu contraseña es:</Text>
          <Text style={[styles.value, { color: valueColor }]}>{password}</Text>
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
