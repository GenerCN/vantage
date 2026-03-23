import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 1. Tomamos el control de la barra superior */}
      <Stack.Screen
        options={{
          title: "", // Esto cambia el título central (puedes dejarlo vacío si quieres)
          // 2. Aquí personalizamos exactamente el área que marcaste en azul
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/")}>
              <Text style={styles.headerButton}>HOME</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={styles.title}>Bienvenido a VINTAGE</Text>
      <Text>Tu Sistema de Inventario</Text>
      <Text>Lograste entrar con una cuenta random 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  headerButton: {
    color: "#ffffff", // Un azul clásico de enlaces (puedes cambiarlo)
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
  },
});
