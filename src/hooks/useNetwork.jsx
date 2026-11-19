import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Estado de conectividade em tempo real.
// isInternetReachable pode vir null no início: nesse caso confiamos em isConnected.
export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  return { isOnline };
}
