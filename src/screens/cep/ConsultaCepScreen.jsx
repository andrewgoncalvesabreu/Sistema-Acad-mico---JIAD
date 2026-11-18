import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ConsultaCepScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Consulta ViaCEP</Text>
      <Text style={styles.subtitle}>Integração com API externa de endereços.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0D9488', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280' },
});