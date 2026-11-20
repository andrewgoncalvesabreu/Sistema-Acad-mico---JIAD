import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { OptionSelector } from '../../components/OptionSelector';
import { CepInput } from '../../components/CepInput';
import { colors } from '../../styles/colors';
import { STATUS_OPTIONS } from '../../utils/constants';
import {
  EMPTY_ALUNO_FORM,
  toAlunoForm,
  toAlunoPayload,
  formatPhone,
  maskDateBr,
} from '../../utils/formatters';
import { validateAluno } from '../../utils/validators';
import { getAluno, createAluno, updateAluno } from '../../repository/alunoRepository';

// Mesma tela para cadastrar (/alunos/form) e editar (/alunos/form?id=...).
export default function AlunoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_ALUNO_FORM);
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
        const aluno = await getAluno(id);
        if (!active) return;
        if (aluno) {
          setForm(toAlunoForm(aluno));
        } else {
          setNotFound(true);
          setSubmitError('Aluno não encontrado. Ele pode ter sido excluído.');
        }
      } catch (e) {
        if (active) setSubmitError(e.message || 'Não foi possível carregar o aluno.');
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

  // Preenche o endereço automaticamente quando o ViaCEP encontra o CEP.
  function handleAddressFound(address) {
    setForm((prev) => ({
      ...prev,
      cep: address.cep || prev.cep,
      logradouro: address.logradouro || '',
      bairro: address.bairro || '',
      cidade: address.cidade || '',
      uf: address.uf || '',
    }));
    setErrors((prev) => ({
      ...prev,
      cep: undefined,
      logradouro: undefined,
      bairro: undefined,
      cidade: undefined,
      uf: undefined,
    }));
  }

  async function handleSave() {
    const result = validateAluno(form);
    setErrors(result.errors);
    if (!result.isValid) {
      setSubmitError('Corrija os campos destacados para continuar.');
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const payload = toAlunoPayload(form);
      if (isEditing) {
        await updateAluno(id, payload);
      } else {
        await createAluno(payload);
      }
      router.back();
    } catch (e) {
      setSubmitError(e.message || 'Não foi possível salvar o aluno. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={isEditing ? 'Editar aluno' : 'Novo aluno'} />
      {loading ? (
        <Loading message="Carregando aluno..." />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.section}>Dados pessoais</Text>
            <Input
              label="Nome completo"
              value={form.nome}
              onChangeText={(v) => setField('nome', v)}
              error={errors.nome}
              placeholder="Ex.: Maria da Silva"
            />
            <Input
              label="E-mail"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="nome@dominio.com"
            />
            <Input
              label="Telefone"
              value={form.telefone}
              onChangeText={(v) => setField('telefone', formatPhone(v))}
              error={errors.telefone}
              keyboardType="phone-pad"
              placeholder="(61) 91234-5678"
              maxLength={15}
            />
            <Input
              label="CPF ou matrícula"
              value={form.cpfMatricula}
              onChangeText={(v) => setField('cpfMatricula', v)}
              error={errors.cpfMatricula}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="CPF (só números) ou matrícula"
              maxLength={20}
            />
            <Input
              label="Data de nascimento"
              value={form.dataNascimento}
              onChangeText={(v) => setField('dataNascimento', maskDateBr(v))}
              error={errors.dataNascimento}
              keyboardType="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
            />
            <OptionSelector
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => setField('status', v)}
              error={errors.status}
            />

            <Text style={styles.section}>Endereço</Text>
            <CepInput
              value={form.cep}
              onChangeText={(v) => setField('cep', v)}
              onAddressFound={handleAddressFound}
              error={errors.cep}
            />
            <Input
              label="Logradouro"
              value={form.logradouro}
              onChangeText={(v) => setField('logradouro', v)}
              error={errors.logradouro}
              placeholder="Rua, avenida..."
            />
            <Input
              label="Número"
              value={form.numero}
              onChangeText={(v) => setField('numero', v)}
              error={errors.numero}
              placeholder="Ex.: 120 ou S/N"
              maxLength={10}
            />
            <Input
              label="Complemento (opcional)"
              value={form.complemento}
              onChangeText={(v) => setField('complemento', v)}
              placeholder="Apto, bloco..."
            />
            <Input
              label="Bairro"
              value={form.bairro}
              onChangeText={(v) => setField('bairro', v)}
              error={errors.bairro}
            />
            <Input
              label="Cidade"
              value={form.cidade}
              onChangeText={(v) => setField('cidade', v)}
              error={errors.cidade}
            />
            <Input
              label="UF"
              value={form.uf}
              onChangeText={(v) => setField('uf', v.replace(/[^A-Za-z]/g, '').toUpperCase())}
              error={errors.uf}
              autoCapitalize="characters"
              placeholder="DF"
              maxLength={2}
            />

            {submitError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            ) : null}

            <Button
              title={isEditing ? 'Salvar alterações' : 'Cadastrar aluno'}
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
  section: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginTop: 4, marginBottom: 10 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 8 },
  errorText: { color: colors.error, fontSize: 14 },
});