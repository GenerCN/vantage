import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function StarWarsScreen() {
  // Estados para guardar los personajes y manejar la pantalla de carga
  const [personajes, setPersonajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // useEffect se ejecuta una sola vez cuando la pantalla se abre
  useEffect(() => {
    obtenerPersonajes();
  }, []);

  const obtenerPersonajes = async () => {
    try {
      // Hacemos la petición a la API pública
      const respuesta = await fetch("https://www.swapi.tech/api/people");
      const json = await respuesta.json();

      // swapi.tech devuelve la lista dentro de "json.results"
      setPersonajes(json.results);
    } catch (error) {
      console.error("Error al obtener datos de SWAPI: ", error);
    } finally {
      setCargando(false); // Apagamos el indicador de carga
    }
  };

  // Pantalla mientras los datos se descargan
  if (cargando) {
    return (
      <View style={styles.centrado}>
        {/* Un pequeño guiño en el color de carga */}
        <ActivityIndicator size="large" color="#FFE81F" />
        <Text style={styles.textoCargando}>
          Viajando a una galaxia muy lejana...
        </Text>
      </View>
    );
  }

  // Pantalla principal con la lista
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Universo Star Wars</Text>

      <FlatList
        data={personajes}
        // swapi.tech usa 'uid' como identificador único en lugar de 'id'
        keyExtractor={(item) => item.uid.toString()}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.textoNombre}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000", // Fondo negro espacial
  },
  textoCargando: {
    color: "#FFE81F", // Amarillo Star Wars
    marginTop: 10,
  },
  contenedor: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#000", // Fondo negro
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFE81F", // Amarillo Star Wars
    marginBottom: 20,
    textAlign: "center",
  },
  tarjeta: {
    backgroundColor: "#1C1C1C",
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  textoNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
});
