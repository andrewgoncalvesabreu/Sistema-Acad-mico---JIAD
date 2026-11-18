import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  // Simulação de contadores e status (depois virão dos repositórios / hooks)
  const stats = { alunos: 0, cursos: 0, matriculas: 0 };
  const isOnline = true; // Integrará com useNetwork() do Davi

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Indicador de Conexão */}
      <View style={[styles.banner, { backgroundColor: isOnline ? '#16A34A' : '#D97706' }]}>
        <Text style={styles.bannerText}>
          {isOnline ? '🟢 Sistema Online (Firestore Ativo)' : '🟠 Modo Offline (SQLite Ativo - Sincronização Pendente)'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Painel Acadêmico</Text>
          <Text style={styles.subtitle}>Gerenciamento integrado JIAD</Text>
        </View>

        {/* Resumo em Cards */}
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/alunos')} activeOpacity={0.7}>
            <Text style={styles.cardNumber}>{stats.alunos}</Text>
            <Text style={styles.cardLabel}>Alunos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/cursos')} activeOpacity={0.7}>
            <Text style={styles.cardNumber}>{stats.cursos}</Text>
            <Text style={styles.cardLabel}>Cursos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/matriculas')} activeOpacity={0.7}>
            <Text style={styles.cardNumber}>{stats.matriculas}</Text>
            <Text style={styles.cardLabel}>Matrículas</Text>
          </TouchableOpacity>
        </View>

        {/* Atalhos Rápidos para os CRUDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Módulos do Sistema</Text>

          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/alunos')}>
            <Text style={styles.menuButtonText}>👥 Gerenciar Alunos (CRUD 1)</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/cursos')}>
            <Text style={styles.menuButtonText}>📚 Gerenciar Cursos (CRUD 2)</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/matriculas')}>
            <Text style={styles.menuButtonText}>📝 Gerenciar Matrículas (CRUD 3)</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cepButton} onPress={() => router.push('/cep')}>
            <Text style={styles.cepButtonText}>📍 Consultar CEP (ViaCEP)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 4,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  menuArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  cepButton: {
    backgroundColor: '#0D9488',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  cepButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});