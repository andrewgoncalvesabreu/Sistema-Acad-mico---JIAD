import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { SelectList } from '../../components/SelectList';
import { StatusChip } from '../../components/StatusChip';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { turmaRepository } from '../../repository/turmaRepository';
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

export default function TurmaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [disponiveis, setDisponiveis] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const details = await turmaRepository.getDetails(String(id));
      setItem(details);
      setDisponiveis(details ? await turmaRepository.listAlunosDisponiveis(details.id) : []);
      setAlunoSelecionado('');
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

  // Executa uma ação, mostra o erro (se houver) e recarrega a tela.
  async function run(action, errorTitle) {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (e) {
      showMessage(errorTitle, e?.message);
    } finally {
      setBusy(false);
    }
  }

  function handleAddAluno() {
    if (!alunoSelecionado) {
      showMessage('Selecione um aluno', 'Escolha na lista qual aluno entra na turma.');
      return;
    }
    run(() => turmaRepository.addAluno(item.id, alunoSelecionado), 'Não foi possível adicionar');
  }

  async function handleRemoveAluno(aluno) {
    const ok = await confirmAction('Remover da turma', `Tirar ${aluno.nome} desta turma?`, 'Remover');
    if (!ok) return;
    run(() => turmaRepository.removeAluno(item.id, aluno.id), 'Não foi possível remover');
  }

  async function handleStatus(status, title, message) {
    if (!(await confirmAction(title, message, 'Confirmar'))) return;
    run(() => turmaRepository.setStatus(item.id, status), 'Não foi possível alterar o status');
  }

  async function handleDelete() {
    const ok = await confirmAction(
      'Excluir turma',
      'A turma será removida definitivamente (os alunos continuam cadastrados). Deseja continuar?',
      'Excluir'
    );
    if (!ok) return;
    setBusy(true);
    try {
      await turmaRepository.remove(item.id);
      router.back();
    } catch (e) {
      showMessage('Não foi possível excluir', e?.message);
      setBusy(false);
    }
  }

  const aberta = item?.status === 'aberta';
  const alunoOptions = disponiveis.map((a) => ({
    value: a.id,
    label: a.nome,
    sublabel: a.email || a.cpfMatricula,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Detalhes da turma" />
      <SyncStatusBar />
      {loading ? (
        <Loading />
      ) : !item ? (
        <View style={styles.notFound}>
          <Text style={styles.fieldValue}>Turma não encontrada. Ela pode ter sido excluída.</Text>
          <Button title="Voltar" onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <StatusChip status={item.status} />
            </View>
            <Field label="Turma" value={item.nome} />
            <Field
              label="Curso"
              value={`${item.cursoNome}${item.cursoCodigo ? ` (${item.cursoCodigo})` : ''}`}
            />
            <Field label="Período" value={item.periodo} />
            <Field label="Vagas" value={`${item.totalAlunos} de ${item.vagas} preenchidas`} />
            <Text style={styles.sync}>{SYNC_TEXT[item.syncStatus] || SYNC_TEXT.synced}</Text>
          </View>

          <Text style={styles.sectionTitle}>Alunos da turma ({item.totalAlunos})</Text>
          <View style={styles.card}>
            {item.alunos.length === 0 ? (
              <Text style={styles.empty}>Nenhum aluno nesta turma ainda.</Text>
            ) : (
              item.alunos.map((aluno) => (
                <View key={aluno.id} style={styles.alunoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alunoNome}>{aluno.nome}</Text>
                    {aluno.email ? <Text style={styles.alunoInfo}>{aluno.email}</Text> : null}
                  </View>
                  {aberta ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveAluno(aluno)}
                      disabled={busy}
                      accessibilityLabel={`Remover ${aluno.nome} da turma`}
                    >
                      <Text style={styles.remove}>Remover</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>

          {aberta ? (
            <View style={styles.card}>
              <SelectList
                label="Adicionar aluno à turma"
                options={alunoOptions}
                value={alunoSelecionado}
                onChange={setAlunoSelecionado}
                emptyText="Nenhum aluno ativo disponível. Cadastre um aluno ou remova-o de outra turma."
              />
              <Button
                title="Adicionar à turma"
                variant="secondary"
                onPress={handleAddAluno}
                disabled={busy || alunoOptions.length === 0}
              />
            </View>
          ) : (
            <Text style={styles.closedNote}>
              Turma encerrada: reabra para alterar a lista de alunos.
            </Text>
          )}

          <Button
            title="Editar"
            onPress={() => router.push({ pathname: '/turmas/form', params: { id: item.id } })}
            disabled={busy}
          />
          {aberta ? (
            <Button
              title="Encerrar turma"
              variant="outline"
              disabled={busy}
              onPress={() =>
                handleStatus('encerrada', 'Encerrar turma', 'A turma não aceitará mais alunos até ser reaberta.')
              }
            />
          ) : (
            <Button
              title="Reabrir turma"
              variant="outline"
              disabled={busy}
              onPress={() => handleStatus('aberta', 'Reabrir turma', 'A turma voltará a aceitar alunos.')}
            />
          )}
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 4 },
  empty: { fontSize: 14, color: colors.textSecondary },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  alunoNome: { fontSize: 15, fontWeight: '600', color: colors.text },
  alunoInfo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  remove: { color: colors.error, fontSize: 14, fontWeight: '700' },
  closedNote: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
});
