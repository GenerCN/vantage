import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  icon: {
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#4b4848",
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#776f6f",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#3d3838",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#transparent",
    borderWidth: 2,
    borderColor: "#007AFF",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: {
    color: "#007AFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
