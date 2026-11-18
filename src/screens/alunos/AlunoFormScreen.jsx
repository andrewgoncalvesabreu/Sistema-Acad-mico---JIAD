import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AlunoFormScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela de Formulário / Cadastro</Text>
      <Text style={styles.subtitle}>Os campos de cadastro ficarão aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280' },
});