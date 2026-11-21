import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

const MAP = {
  ativa: { label: 'Ativa', bg: '#DCFCE7', fg: '#166534' },
  concluida: { label: 'Concluída', bg: '#DBEAFE', fg: '#1E40AF' },
  cancelada: { label: 'Cancelada', bg: '#FEE2E2', fg: '#991B1B' },
  ativo: { label: 'Ativo', bg: '#DCFCE7', fg: '#166534' },
  inativo: { label: 'Inativo', bg: '#E2E8F0', fg: '#475569' },
  aberta: { label: 'Aberta', bg: '#DCFCE7', fg: '#166534' },
  encerrada: { label: 'Encerrada', bg: '#E2E8F0', fg: '#475569' },
};

export function StatusChip({ status }) {
  const item = MAP[status] || { label: status || '—', bg: '#E2E8F0', fg: colors.textSecondary };
  return (
    <View style={[styles.chip, { backgroundColor: item.bg }]}>
      <Text style={[styles.text, { color: item.fg }]}>{item.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '700' },
});
