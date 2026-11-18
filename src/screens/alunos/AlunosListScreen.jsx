import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AlunosListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Lista de Alunos</Text>
      <Text style={styles.subtitle}>Módulo do CRUD de Alunos (Italo)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
  },
});