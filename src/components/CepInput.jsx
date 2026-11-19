import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { colors } from '../styles/colors';
import { buscarCep, formatCep, onlyDigits, CepError } from '../services/api/cepService';

/**
 * Campo de CEP com busca no ViaCEP — para usar no cadastro/edição de aluno.
 * Quando encontra, chama onAddressFound({ cep, logradouro, bairro, cidade, uf }).
 * Se a API falhar, o aluno continua preenchendo o endereço manualmente.
 *
 * Exemplo no AlunoFormScreen:
 *   <CepInput
 *     value={form.endereco.cep}
 *     onChangeText={(cep) => setEndereco({ cep })}
 *     onAddressFound={(a) => setEndereco(a)}   // preenche cep, logradouro, bairro, cidade, uf
 *   />
 */
export function CepInput({ value, onChangeText, onAddressFound, error }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // info | error | success

  async function search(cep) {
    setLoading(true);
    setMessage('');
    try {
      const address = await buscarCep(cep);
      onAddressFound?.(address);
      setMessageType('success');
      setMessage('Endereço preenchido. Informe o número e o complemento.');
    } catch (e) {
      setMessageType('error');
      setMessage(e instanceof CepError ? e.message : 'Não foi possível consultar o CEP.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(text) {
    const masked = formatCep(text);
    onChangeText?.(masked);
    setMessage('');
    if (onlyDigits(masked).length === 8) search(masked); // busca automática ao completar 8 dígitos
  }

  return (
    <View style={styles.container}>
      <Input
        label="CEP"
        value={value}
        onChangeText={handleChange}
        placeholder="00000-000"
        keyboardType="number-pad"
        maxLength={9}
        error={error}
        accessibilityLabel="CEP"
      />
      <Button
        title="Buscar endereço pelo CEP"
        variant="outline"
        onPress={() => search(value)}
        loading={loading}
        disabled={onlyDigits(value).length !== 8}
      />
      {message ? (
        <Text
          style={[
            styles.message,
            messageType === 'error' && { color: colors.error },
            messageType === 'success' && { color: colors.success },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 8 },
  message: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 6 },
});
