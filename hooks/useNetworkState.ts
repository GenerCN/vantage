import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

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

        setNetworkState({
          isConnected,
          isWifiEnabled: state.isWifiEnabled ?? false,
          type,
        });

        // Si recuperamos conexión después de haber estado desconectados
        if (isConnected && wasDisconnected) {
          console.log('🔄 Conexión restaurada, sincronizando...');
          setWasDisconnected(false);
          onNetworkRestore?.();
        }

        // Si perdemos conexión
        if (!isConnected && !wasDisconnected) {
          console.log('📴 Sin conexión a internet');
          setWasDisconnected(true);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.warn('Error configurando NetInfo listener:', error);
    }
  }, [wasDisconnected, onNetworkRestore]);

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
