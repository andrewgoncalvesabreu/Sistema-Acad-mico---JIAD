import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ListScreenTemplate() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Registros</Text>
      <Text style={styles.empty}>Nenhum item cadastrado ainda.</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('./form')} // ou o caminho do formulário
      >
        <Text style={styles.buttonText}>+ Novo Cadastro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  empty: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  button: { backgroundColor: '#1D4ED8', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});