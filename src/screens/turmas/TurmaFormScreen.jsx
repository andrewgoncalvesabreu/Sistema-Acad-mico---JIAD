import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { Loading } from '../../components/Loading';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectList } from '../../components/SelectList';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { turmaRepository, validateTurma } from '../../repository/turmaRepository';
import { showMessage } from '../../utils/dialogs';
import { colors } from '../../styles/colors';

export default function TurmaFormScreen() {
  const { id } = useLocalSearchParams();
  const editing = Boolean(id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ nome: '', cursoId: '', periodo: '', vagas: '30' });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const options = await turmaRepository.listOptions();
        if (!active) return;
        setCursos(options.cursos);

        if (id) {
          const t = await turmaRepository.getById(String(id));
          if (!t) {
            showMessage('Turma não encontrada', 'Ela pode ter sido excluída.');
            router.back();
            return;
          }
          setForm({
            nome: t.nome,
            cursoId: t.cursoId,
            periodo: t.periodo,
            vagas: String(t.vagas),
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

  // novas turmas: só cursos ativos; na edição, mantém o curso já escolhido
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
    const found = validateTurma(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      if (editing) await turmaRepository.update(String(id), form);
      else await turmaRepository.create(form);
      router.back();
    } catch (e) {
      showMessage('Não foi possível salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const title = editing ? 'Editar turma' : 'Nova turma';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title={title} />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={title} />
      <SyncStatusBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SelectList
            label="Curso"
            options={cursoOptions}
            value={form.cursoId}
            onChange={set('cursoId')}
            error={errors.cursoId}
            emptyText="Nenhum curso ativo. Cadastre um curso primeiro."
          />
          <Input
            label="Nome da turma"
            value={form.nome}
            onChangeText={set('nome')}
            placeholder="Ex.: Turma A"
            maxLength={40}
            error={errors.nome}
          />
          <Input
            label="Período"
            value={form.periodo}
            onChangeText={set('periodo')}
            placeholder="Ex.: 2026.2"
            maxLength={30}
            error={errors.periodo}
          />
          <Input
            label="Vagas"
            value={form.vagas}
            onChangeText={(t) => set('vagas')(t.replace(/\D/g, ''))}
            placeholder="Ex.: 30"
            keyboardType="number-pad"
            maxLength={3}
            error={errors.vagas}
          />

          <Button
            title={editing ? 'Salvar alterações' : 'Cadastrar turma'}
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
});
