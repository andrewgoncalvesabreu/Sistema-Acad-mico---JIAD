import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { OptionSelector } from '../../components/OptionSelector';
import { colors } from '../../styles/colors';
import { TURNOS, STATUS_OPTIONS } from '../../utils/constants';
import { onlyDigits, EMPTY_CURSO_FORM, toCursoForm, toCursoPayload } from '../../utils/formatters';
import { validateCurso } from '../../utils/validators';
import { getCurso, createCurso, updateCurso } from '../../repository/cursoRepository';

// Mesma tela para cadastrar (/cursos/form) e editar (/cursos/form?id=...).
export default function CursoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_CURSO_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isEditing) return undefined;
    let active = true;
    (async () => {
      try {
        const curso = await getCurso(id);
        if (!active) return;
        if (curso) {
          setForm(toCursoForm(curso));
        } else {
          setNotFound(true);
          setSubmitError('Curso não encontrado. Ele pode ter sido excluído.');
        }
      } catch (e) {
        if (active) setSubmitError(e.message || 'Não foi possível carregar o curso.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSave() {
    const result = validateCurso(form);
    setErrors(result.errors);
    if (!result.isValid) return;

    setSaving(true);
    setSubmitError('');
    try {
      const payload = toCursoPayload(form);
      if (isEditing) {
        await updateCurso(id, payload);
      } else {
        await createCurso(payload);
      }
      router.back();
    } catch (e) {
      setSubmitError(e.message || 'Não foi possível salvar o curso. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={isEditing ? 'Editar curso' : 'Novo curso'} />
      {loading ? (
        <Loading message="Carregando curso..." />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Input
              label="Nome do curso"
              value={form.nome}
              onChangeText={(v) => setField('nome', v)}
              error={errors.nome}
              placeholder="Ex.: Análise e Desenvolvimento de Sistemas"
            />
            <Input
              label="Código"
              value={form.codigo}
              onChangeText={(v) => setField('codigo', v.toUpperCase())}
              error={errors.codigo}
              autoCapitalize="characters"
              placeholder="Ex.: ADS01"
              maxLength={10}
            />
            <Input
              label="Descrição"
              value={form.descricao}
              onChangeText={(v) => setField('descricao', v)}
              error={errors.descricao}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Resumo do curso"
            />
            <Input
              label="Carga horária (horas)"
              value={form.cargaHoraria}
              onChangeText={(v) => setField('cargaHoraria', onlyDigits(v))}
              error={errors.cargaHoraria}
              keyboardType="numeric"
              placeholder="Ex.: 2400"
              maxLength={5}
            />
            <OptionSelector
              label="Turno"
              options={TURNOS}
              value={form.turno}
              onChange={(v) => setField('turno', v)}
              error={errors.turno}
            />
            <OptionSelector
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => setField('status', v)}
              error={errors.status}
            />

            {submitError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            ) : null}

            <Button
              title={isEditing ? 'Salvar alterações' : 'Cadastrar curso'}
              onPress={handleSave}
              loading={saving}
              disabled={notFound}
            />
            <Button title="Cancelar" variant="outline" onPress={() => router.back()} disabled={saving} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, backgroundColor: colors.background },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 8 },
  errorText: { color: colors.error, fontSize: 14 },
});
