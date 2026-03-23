import { StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear una Cuenta</Text>
      <Text>Aquí irá tu formulario de registro en el futuro 🚀</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
