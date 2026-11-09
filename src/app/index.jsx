import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Sistema Acadêmico - JIAD</Text>
        <Text style={styles.subtitle}>
          Gerencie alunos, cursos e matrículas
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Bem-vindo ao sistema</Text>

        <Text style={styles.description}>
          Esta será a tela principal do aplicativo acadêmico. Nas próximas
          etapas, vamos adicionar autenticação, cadastros e sincronização
          com o banco de dados.
        </Text>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardNumber}>0</Text>
            <Text style={styles.cardLabel}>Alunos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardNumber}>0</Text>
            <Text style={styles.cardLabel}>Cursos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardNumber}>0</Text>
            <Text style={styles.cardLabel}>Matrículas</Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Projeto em configuração</Text>
          <Text style={styles.statusText}>
            A estrutura inicial do aplicativo está funcionando.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#DBEAFE',
    fontSize: 15,
    marginTop: 8,
  },
  content: {
    padding: 24,
  },
  welcome: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 18,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  cardNumber: {
    color: '#1D4ED8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 6,
  },
  statusBox: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 28,
    padding: 18,
  },
  statusTitle: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#1E40AF',
    fontSize: 14,
    marginTop: 6,
  },
});
