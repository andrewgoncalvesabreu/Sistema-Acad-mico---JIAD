import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { buscarCep, formatCep, onlyDigits, CepError } from '../../services/api/cepService';
import { colors } from '../../styles/colors';

export default function ConsultaCepScreen() {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSearch() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await buscarCep(cep));
    } catch (e) {
      setError(e instanceof CepError ? e.message : 'Não foi possível consultar o CEP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Consulta de CEP" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Digite um CEP para consultar o endereço pela API ViaCEP. O mesmo serviço preenche o
          endereço no cadastro de alunos.
        </Text>

        <Input
          label="CEP"
          value={cep}
          onChangeText={(t) => {
            setCep(formatCep(t));
            setError('');
          }}
          placeholder="00000-000"
          keyboardType="number-pad"
          maxLength={9}
          error={error}
          onSubmitEditing={handleSearch}
        />
        <Button
          title="Consultar"
          onPress={handleSearch}
          loading={loading}
          disabled={onlyDigits(cep).length !== 8}
        />

        {result ? (
          <View style={styles.card}>
            <Row label="CEP" value={result.cep} />
            <Row label="Logradouro" value={result.logradouro} />
            <Row label="Bairro" value={result.bairro} />
            <Row label="Cidade" value={result.cidade} />
            <Row label="UF" value={result.uf} />
          </View>
        ) : null}

        <Text style={styles.endpoint}>Endpoint: GET https://viacep.com.br/ws/{'{cep}'}/json/</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { marginBottom: 10 },
  rowLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  rowValue: { fontSize: 16, color: colors.text, marginTop: 2 },
  endpoint: { fontSize: 12, color: colors.textSecondary, marginTop: 20 },
});
