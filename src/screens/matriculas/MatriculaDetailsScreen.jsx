import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { StatusChip } from '../../components/StatusChip';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { matriculaRepository } from '../../repository/matriculaRepository';
import { isoToBr } from '../../utils/dates';
import { confirmAction, showMessage } from '../../utils/dialogs';
import { colors } from '../../styles/colors';

const SYNC_TEXT = {
  synced: '✅ Sincronizado com o Firestore',
  pending: '⏳ Pendente de sincronização (salvo no aparelho)',
  error: '⚠️ Falha ao sincronizar (nova tentativa automática)',
};

function Field({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

export default function MatriculaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItem(await matriculaRepository.getDetails(String(id)));
    } catch (e) {
      showMessage('Erro ao carregar', e?.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function changeStatus(status, title, message) {
    if (!(await confirmAction(title, message, 'Confirmar'))) return;
    setBusy(true);
    try {
      await matriculaRepository.setStatus(item.id, status);
      await load();
    } catch (e) {
      showMessage('Não foi possível alterar o status', e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmAction(
      'Excluir matrícula',
      'Essa ação remove a matrícula definitivamente. Deseja continuar?',
      'Excluir'
    );
    if (!ok) return;
    setBusy(true);
    try {
      await matriculaRepository.remove(item.id);
      router.back();
    } catch (e) {
      showMessage('Não foi possível excluir', e?.message);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Detalhes da matrícula" />
      <SyncStatusBar />
      {loading ? (
        <Loading />
      ) : !item ? (
        <View style={styles.notFound}>
          <Text style={styles.fieldValue}>Matrícula não encontrada. Ela pode ter sido excluída.</Text>
          <Button title="Voltar" onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <StatusChip status={item.status} />
            </View>
            <Field label="Aluno" value={item.alunoNome} />
            <Field label="E-mail do aluno" value={item.alunoEmail} />
            <Field
              label="Curso"
              value={`${item.cursoNome}${item.cursoCodigo ? ` (${item.cursoCodigo})` : ''}`}
            />
            <Field label="Data da matrícula" value={isoToBr(item.dataMatricula)} />
            <Field label="Período / turma" value={item.periodo} />
            <Text style={styles.sync}>{SYNC_TEXT[item.syncStatus] || SYNC_TEXT.synced}</Text>
          </View>

          <Button
            title="Editar"
            onPress={() => router.push({ pathname: '/matriculas/form', params: { id: item.id } })}
            disabled={busy}
          />
          {item.status === 'ativa' ? (
            <>
              <Button
                title="Marcar como concluída"
                variant="secondary"
                disabled={busy}
                onPress={() =>
                  changeStatus('concluida', 'Concluir matrícula', 'Marcar esta matrícula como concluída?')
                }
              />
              <Button
                title="Cancelar matrícula"
                variant="outline"
                disabled={busy}
                onPress={() =>
                  changeStatus('cancelada', 'Cancelar matrícula', 'A matrícula ficará com status cancelada.')
                }
              />
            </>
          ) : null}
          <Button title="Excluir" variant="danger" onPress={handleDelete} loading={busy} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  notFound: { padding: 24, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: { flexDirection: 'row', marginBottom: 8 },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  fieldValue: { fontSize: 16, color: colors.text, marginTop: 2 },
  sync: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
