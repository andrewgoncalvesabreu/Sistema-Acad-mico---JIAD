import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { Loading } from '../../components/Loading';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectList } from '../../components/SelectList';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import {
  matriculaRepository,
  validateMatricula,
  STATUS_MATRICULA,
  STATUS_LABEL,
} from '../../repository/matriculaRepository';
import { todayIso, isoToBr, brToIso, maskDateBr } from '../../utils/dates';
import { showMessage } from '../../utils/dialogs';
import { colors } from '../../styles/colors';

export default function MatriculaFormScreen() {
  const { id } = useLocalSearchParams();
  const editing = Boolean(id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    alunoId: '',
    cursoId: '',
    dataMatricula: isoToBr(todayIso()),
    periodo: '',
    status: 'ativa',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const options = await matriculaRepository.listOptions();
        if (!active) return;
        setAlunos(options.alunos);
        setCursos(options.cursos);

        if (id) {
          const m = await matriculaRepository.getById(String(id));
          if (!m) {
            showMessage('Matrícula não encontrada', 'Ela pode ter sido excluída.');
            router.back();
            return;
          }
          setForm({
            alunoId: m.alunoId,
            cursoId: m.cursoId,
            dataMatricula: isoToBr(m.dataMatricula),
            periodo: m.periodo,
            status: m.status,
          });
        }
      } catch (e) {
        showMessage('Erro ao carregar', e?.message || 'Tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, router]);

  const set = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // novos cadastros: só alunos/cursos ativos; na edição, mantém o item já escolhido
  const alunoOptions = useMemo(
    () =>
      alunos
        .filter((a) => a.status === 'ativo' || a.id === form.alunoId)
        .map((a) => ({ value: a.id, label: a.nome, sublabel: a.cpfMatricula })),
    [alunos, form.alunoId]
  );
  const cursoOptions = useMemo(
    () =>
      cursos
        .filter((c) => c.status === 'ativo' || c.id === form.cursoId)
        .map((c) => ({
          value: c.id,
          label: c.nome,
          sublabel: `${c.codigo || 's/ código'}${c.turno ? ` • ${c.turno}` : ''}${
            c.status === 'inativo' ? ' • inativo' : ''
          }`,
        })),
    [cursos, form.cursoId]
  );

  async function handleSave() {
    const values = { ...form, dataMatricula: brToIso(form.dataMatricula) };
    const found = validateMatricula(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      if (editing) await matriculaRepository.update(String(id), values);
      else await matriculaRepository.create(values);
      router.back();
    } catch (e) {
      showMessage('Não foi possível salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title={editing ? 'Editar matrícula' : 'Nova matrícula'} />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={editing ? 'Editar matrícula' : 'Nova matrícula'} />
      <SyncStatusBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SelectList
            label="Aluno"
            options={alunoOptions}
            value={form.alunoId}
            onChange={set('alunoId')}
            error={errors.alunoId}
            emptyText="Nenhum aluno ativo. Cadastre um aluno primeiro."
          />
          <SelectList
            label="Curso"
            options={cursoOptions}
            value={form.cursoId}
            onChange={set('cursoId')}
            error={errors.cursoId}
            emptyText="Nenhum curso ativo. Cadastre um curso primeiro."
          />
          <Input
            label="Data da matrícula"
            value={form.dataMatricula}
            onChangeText={(t) => set('dataMatricula')(maskDateBr(t))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            error={errors.dataMatricula}
          />
          <Input
            label="Período / turma"
            value={form.periodo}
            onChangeText={set('periodo')}
            placeholder="Ex.: 2026.2 ou Turma A"
            maxLength={30}
            error={errors.periodo}
          />

          {editing ? (
            <View style={styles.statusBox}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_MATRICULA.map((s) => (
                  <Button
                    key={s}
                    title={STATUS_LABEL[s]}
                    variant={form.status === s ? 'primary' : 'outline'}
                    onPress={() => set('status')(s)}
                    style={styles.statusBtn}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Button
            title={editing ? 'Salvar alterações' : 'Cadastrar matrícula'}
            onPress={handleSave}
            loading={saving}
          />
          <Button title="Cancelar" variant="outline" onPress={() => router.back()} disabled={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  statusBox: { marginBottom: 12 },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusBtn: { flex: 1, paddingHorizontal: 4 },
});
