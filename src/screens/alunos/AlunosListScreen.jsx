import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';
import { EmptyList } from '../../components/EmptyList';
import { colors } from '../../styles/colors';
import { listAlunos } from '../../repository/alunoRepository';
import { labelStatus, formatCpfMatricula, formatPhone } from '../../utils/formatters';

export default function AlunosListScreen() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError('');
    try {
      setAlunos(await listAlunos());
    } catch (e) {
      setError(e.message || 'Não foi possível carregar os alunos.');
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

  // Busca simples por nome, e-mail ou CPF/matrícula.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return alunos;
    return alunos.filter(
      (a) =>
        String(a.nome).toLowerCase().includes(term) ||
        String(a.email).toLowerCase().includes(term) ||
        String(a.cpfMatricula).toLowerCase().includes(term.replace(/[.\-\s]/g, ''))
    );
  }, [alunos, search]);

  function renderItem({ item }) {
    const ativo = item.status === 'ativo';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/alunos/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Aluno ${item.nome}, ${labelStatus(item.status)}`}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
          <Text style={[styles.badge, ativo ? styles.badgeOn : styles.badgeOff]}>
            {labelStatus(item.status)}
          </Text>
        </View>
        <Text style={styles.cardInfo} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.cardInfo}>
          {formatCpfMatricula(item.cpfMatricula)} · {formatPhone(item.telefone)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Alunos" />
      <View style={styles.body}>
        <Button title="+ Novo aluno" onPress={() => router.push('/alunos/form')} />

        {alunos.length > 0 ? (
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome, e-mail ou CPF/matrícula"
            autoCapitalize="none"
            accessibilityLabel="Buscar aluno"
            style={styles.search}
          />
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar novamente" variant="outline" onPress={() => load()} />
          </View>
        ) : null}

        {loading ? (
          <Loading message="Carregando alunos..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={() => load(true)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              error ? null : search.trim() ? (
                <EmptyList title="Nenhum aluno encontrado" subtitle="Tente outro termo de busca." />
              ) : (
                <EmptyList title="Nenhum aluno cadastrado" />
              )
            }
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
  search: { marginTop: 8, marginBottom: 0 },
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
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginTop: 8 },
  errorText: { color: colors.error, fontSize: 14 },
});
