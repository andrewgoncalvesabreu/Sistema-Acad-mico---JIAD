import { Alert, Platform } from 'react-native';

// Confirmação de ações destrutivas. Alert.alert não funciona no navegador,
// então no web usamos window.confirm. Retorna Promise<boolean>.
export function confirmAction(title, message, confirmLabel = 'Excluir') {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
