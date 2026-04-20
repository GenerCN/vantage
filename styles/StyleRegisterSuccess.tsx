import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f4f9", // Un fondo gris muy clarito para que la tarjeta resalte
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 20,
  },
  infoBox: {
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
