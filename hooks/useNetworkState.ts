import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isWifiEnabled: boolean;
  type: string;
}

/**
 * Hook que detecta el estado de la conexión a internet
 * y ejecuta un callback cuando la conexión vuelve
 */
export function useNetworkState(onNetworkRestore?: () => void) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true, // Asumir conectado por defecto
    isWifiEnabled: true,
    type: 'unknown',
  });

  const [wasDisconnected, setWasDisconnected] = useState(false);

  //Guardar la función en una referencia para no meterla en el useEffect
  const savedCallback = useRef(onNetworkRestore);
  useEffect(() => {
    savedCallback.current = onNetworkRestore;
  }, [onNetworkRestore]);

  useEffect(() => {
    // Si NetInfo no está disponible, usar fallback
    if (!NetInfo?.addEventListener) {
      console.log('📱 Usando fallback para detección de red');
      return;
    }

    try {
      // Listener para cambios en el estado de la red
      const unsubscribe = NetInfo.addEventListener((state: any) => {
        const isConnected = state.isConnected ?? false;
        const type = state.type ?? 'unknown';
        const isWifiEnabled = state.isWifiEnabled ?? false;

        // Solo actualizar si los valores REALMENTE cambiaron (evita re-renders infinitos)
        setNetworkState(prevState => {
          if (prevState.isConnected === isConnected && prevState.type === type && prevState.isWifiEnabled === isWifiEnabled) {
            return prevState; // Si todo está igual, no hacemos nada
          }
          return { isConnected, isWifiEnabled, type };
        });

        // Usar el estado previo (prev) para no depender de variables externas
        setWasDisconnected(prevWasDisconnected => {
          // Si recuperamos conexión después de haber estado desconectados
          if (isConnected && prevWasDisconnected) {
            console.log('🔄 Conexión restaurada, sincronizando...');
            savedCallback.current?.(); // Llamamos a la función guardada
            return false;
          }

          // Si perdemos conexión
          if (!isConnected && !prevWasDisconnected) {
            console.log('📴 Sin conexión a internet');
            return true;
          }

          return prevWasDisconnected;
        });
      });

      return () => unsubscribe();
    } catch (error) {
      console.warn('Error configurando NetInfo listener:', error);
    }
  }, []); //Esto detiene el bucle infinito de raíz.

  return networkState;
}

/**
 * Verifica el estado actual de la conexión
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    if (!NetInfo?.fetch) {
      console.log('📱 NetInfo no disponible, asumiendo conexión');
      return true; // Asumir conectado
    }

    const state = await NetInfo.fetch();
    return state.isConnected ?? true;
  } catch (error) {
    console.warn('Error verificando conexión:', error);
    return true; // Asumir conectado en caso de error
  }
}
