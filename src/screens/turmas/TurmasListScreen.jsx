import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Loading } from '../../components/Loading';
import { EmptyList } from '../../components/EmptyList';
import { StatusChip } from '../../components/StatusChip';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { turmaRepository } from '../../repository/turmaRepository';
import { useSync } from '../../hooks/useSync';
import { colors } from '../../styles/colors';

export default function TurmasListScreen() {
  const router = useRouter();
  const { lastSyncAt } = useSync();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // refresh: true  → sincroniza e atualiza do Firestore (ao abrir a tela / puxar para atualizar)
  // refresh: false → só relê o SQLite (usado quando um sync termina; evita um ciclo infinito,
  //                  pois ler com refresh dispara outro sync, que dispararia outra leitura...)
  const load = useCallback(async ({ refresh = true } = {}) => {
    try {
      setError('');
      setItems(await turmaRepository.listWithDetails({ refresh }));
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar as turmas.');
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
  // ...e quando uma sincronização termina (o selo "pendente" some), sem novo sync
  useEffect(() => {
    if (lastSyncAt) load({ refresh: false });
  }, [lastSyncAt, load]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title="Turmas"
        rightElement={
          <TouchableOpacity onPress={() => router.push('/turmas/form')} accessibilityLabel="Nova turma">
            <Text style={styles.add}>+ Nova</Text>
          </TouchableOpacity>
        }
      />
      <SyncStatusBar />

      {loading ? (
        <Loading message="Carregando turmas..." />
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
            error ? null : (
              <EmptyList
                title="Nenhuma turma cadastrada"
                subtitle="Toque em “+ Nova” para criar uma turma de um curso."
              />
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/turmas/${item.id}`)}
              accessibilityLabel={`Turma ${item.nome} do curso ${item.cursoNome}`}
            >
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.nome}
                </Text>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.line} numberOfLines={1}>
                {item.cursoNome}
                {item.cursoCodigo ? ` (${item.cursoCodigo})` : ''}
              </Text>
              <Text style={styles.meta}>
                Período {item.periodo} • {item.totalAlunos}/{item.vagas} alunos
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
