import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 55,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loginButton: {
    backgroundColor: "#007AFF",
  },
  registerButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
});
