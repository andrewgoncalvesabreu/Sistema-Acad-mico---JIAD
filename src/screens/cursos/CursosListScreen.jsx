import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { EmptyList } from '../../components/EmptyList';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { useSync } from '../../hooks/useSync';
import { colors } from '../../styles/colors';
import { listCursos } from '../../repository/cursoRepository';
import { labelTurno, labelStatus, formatCargaHoraria } from '../../utils/formatters';

export default function CursosListScreen() {
  const router = useRouter();
  const { lastSyncAt } = useSync();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false, refresh = true) => {
    if (isRefresh) setRefreshing(true);
    setError('');
    try {
      setCursos(await listCursos({ refresh }));
    } catch (e) {
      setError(e.message || 'Não foi possível carregar os cursos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarrega sempre que a tela volta ao foco (depois de salvar/excluir).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Quando uma sincronização termina, relê só o SQLite (o selo "pendente" some) SEM novo sync:
  // ler com refresh dispararia outro sync, que dispararia outra leitura... (ciclo infinito).
  useEffect(() => {
    if (lastSyncAt) load(false, false);
  }, [lastSyncAt, load]);

  function renderItem({ item }) {
    const ativo = item.status === 'ativo';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/cursos/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Curso ${item.nome}, ${labelStatus(item.status)}`}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
          <Text style={[styles.badge, ativo ? styles.badgeOn : styles.badgeOff]}>
            {labelStatus(item.status)}
          </Text>
        </View>
        <Text style={styles.cardInfo}>
          {item.codigo} · {labelTurno(item.turno)} · {formatCargaHoraria(item.cargaHoraria)}
        </Text>
        {item.syncStatus === 'pending' ? (
          <Text style={styles.pending}>⏳ Pendente de sincronização</Text>
        ) : null}
        {item.syncStatus === 'error' ? (
          <Text style={styles.failed}>⚠️ Falha ao sincronizar (nova tentativa automática)</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Cursos" />
      <SyncStatusBar />
      <View style={styles.body}>
        <Button title="+ Novo curso" onPress={() => router.push('/cursos/form')} />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar novamente" variant="outline" onPress={() => load()} />
          </View>
        ) : null}

        {loading ? (
          <Loading message="Carregando cursos..." />
        ) : (
          <FlatList
            data={cursos}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={() => load(true)}
            ListEmptyComponent={error ? null : <EmptyList title="Nenhum curso cadastrado" />}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, padding: 16, backgroundColor: colors.background },
  list: { paddingTop: 8, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 8 },
  cardInfo: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  badgeOn: { backgroundColor: '#DCFCE7', color: '#166534' },
  badgeOff: { backgroundColor: '#E2E8F0', color: '#475569' },
  pending: { fontSize: 12, color: colors.warning, marginTop: 6, fontWeight: '600' },
  failed: { fontSize: 12, color: colors.error, marginTop: 6, fontWeight: '600' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginTop: 8 },
  errorText: { color: colors.error, fontSize: 14 },
});
