import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { colors } from '../../styles/colors';
import { getAluno, deleteAluno } from '../../repository/alunoRepository';
import {
  labelStatus,
  formatCpfMatricula,
  formatPhone,
  formatCep,
  isoToBr,
} from '../../utils/formatters';
import { confirmAction } from '../../utils/dialogs';

function Field({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

export default function AlunoDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setAluno(await getAluno(id));
    } catch (e) {
      setError(e.message || 'Não foi possível carregar o aluno.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Recarrega ao voltar da edição para mostrar os dados atualizados.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDelete() {
    const confirmed = await confirmAction(
      'Excluir aluno',
      `Deseja realmente excluir "${aluno.nome}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    try {
      await deleteAluno(id);
      router.back();
    } catch (e) {
      setError(e.message || 'Não foi possível excluir o aluno.');
    } finally {
      setDeleting(false);
    }
  }

  const e = aluno?.endereco ?? {};
  const enderecoLinha = [e.logradouro, e.numero && `nº ${e.numero}`, e.complemento]
    .filter(Boolean)
    .join(', ');
  const cidadeLinha = [e.bairro, [e.cidade, e.uf].filter(Boolean).join('/')]
    .filter(Boolean)
    .join(' - ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Detalhes do aluno" />
      {loading ? (
        <Loading message="Carregando aluno..." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {aluno ? (
            <>
              <View style={styles.card}>
                <Field label="Nome" value={aluno.nome} />
                <Field label="E-mail" value={aluno.email} />
                <Field label="Telefone" value={formatPhone(aluno.telefone)} />
                <Field label="CPF / matrícula" value={formatCpfMatricula(aluno.cpfMatricula)} />
                <Field label="Data de nascimento" value={isoToBr(aluno.dataNascimento)} />
                <Field label="Status" value={labelStatus(aluno.status)} />
              </View>

              <View style={styles.card}>
                <Field label="CEP" value={formatCep(e.cep)} />
                <Field label="Endereço" value={enderecoLinha} />
                <Field label="Bairro / cidade" value={cidadeLinha} />
              </View>

              <Button
                title="Editar"
                onPress={() => router.push({ pathname: '/alunos/form', params: { id } })}
                disabled={deleting}
              />
              <Button title="Excluir" variant="danger" onPress={handleDelete} loading={deleting} />
            </>
          ) : !error ? (
            <Text style={styles.empty}>Aluno não encontrado. Ele pode ter sido excluído.</Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { padding: 16, paddingBottom: 32, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  fieldValue: { fontSize: 16, color: colors.text, marginTop: 2 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: colors.error, fontSize: 14 },
  empty: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 24 },
});
