import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSync } from '../hooks/useSync';
import { colors } from '../styles/colors';

// Faixa de status de conexão/sincronização. Reutilizável (Home, listas...).
export function SyncStatusBar() {
  const { isOnline, pendingCount, syncing, lastError, syncNow } = useSync();

  let bg = colors.success;
  let text = '🟢 Online • tudo sincronizado';

  if (!isOnline) {
    bg = colors.warning;
    text =
      pendingCount > 0
        ? `🟠 Offline • ${pendingCount} alteração(ões) salva(s) no aparelho`
        : '🟠 Offline • dados salvos no aparelho (SQLite)';
  } else if (syncing) {
    bg = colors.primary;
    text = '🔄 Sincronizando com o Firestore...';
  } else if (pendingCount > 0) {
    bg = lastError ? colors.error : colors.warning;
    text = lastError
      ? `⚠️ ${pendingCount} pendência(s) com erro • nova tentativa automática`
      : `⏳ ${pendingCount} pendência(s) aguardando envio`;
  }

  const canSync = isOnline && !syncing && pendingCount > 0;

  return (
    <View style={[styles.bar, { backgroundColor: bg }]} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{text}</Text>
      {canSync ? (
        <TouchableOpacity onPress={() => syncNow()} style={styles.button} accessibilityLabel="Sincronizar agora">
          <Text style={styles.buttonText}>Sincronizar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', flex: 1 },
  button: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
