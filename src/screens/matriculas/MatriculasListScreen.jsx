import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Loading } from '../../components/Loading';
import { EmptyList } from '../../components/EmptyList';
import { StatusChip } from '../../components/StatusChip';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { matriculaRepository } from '../../repository/matriculaRepository';
import { useSync } from '../../hooks/useSync';
import { isoToBr } from '../../utils/dates';
import { colors } from '../../styles/colors';

export default function MatriculasListScreen() {
  const router = useRouter();
  const { lastSyncAt } = useSync();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setItems(await matriculaRepository.listWithDetails());
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar as matrículas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // recarrega ao voltar para a tela (depois de criar/editar/excluir)...
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  // ...e quando uma sincronização termina (o selo "pendente" some)
  useEffect(() => {
    if (lastSyncAt) load();
  }, [lastSyncAt, load]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title="Matrículas"
        rightElement={
          <TouchableOpacity
            onPress={() => router.push('/matriculas/form')}
            accessibilityLabel="Nova matrícula"
          >
            <Text style={styles.add}>+ Nova</Text>
          </TouchableOpacity>
        }
      />
      <SyncStatusBar />

      {loading ? (
        <Loading message="Carregando matrículas..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={
            <EmptyList
              title="Nenhuma matrícula cadastrada"
              subtitle="Toque em “+ Nova” para matricular um aluno em um curso."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/matriculas/${item.id}`)}
              accessibilityLabel={`Matrícula de ${item.alunoNome} em ${item.cursoNome}`}
            >
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.alunoNome}
                </Text>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.line} numberOfLines={1}>
                {item.cursoNome}
                {item.cursoCodigo ? ` (${item.cursoCodigo})` : ''}
              </Text>
              <Text style={styles.meta}>
                Período {item.periodo} • {isoToBr(item.dataMatricula)}
              </Text>
              {item.syncStatus === 'pending' ? (
                <Text style={styles.pending}>⏳ Pendente de sincronização</Text>
              ) : null}
              {item.syncStatus === 'error' ? (
                <Text style={styles.failed}>⚠️ Falha ao sincronizar (nova tentativa automática)</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  add: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  error: { color: colors.error, marginBottom: 12, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  pending: { fontSize: 12, color: colors.warning, marginTop: 6, fontWeight: '600' },
  failed: { fontSize: 12, color: colors.error, marginTop: 6, fontWeight: '600' },
});
