import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

// Seletor simples (sem biblioteca): lista rolável com um item selecionado.
// options: [{ value, label, sublabel? }]
export function SelectList({ label, options, value, onChange, error, emptyText, maxHeight = 180 }) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, error && styles.boxError, { maxHeight }]}>
        {options.length === 0 ? (
          <Text style={styles.empty}>{emptyText || 'Nenhuma opção disponível.'}</Text>
        ) : (
          <ScrollView nestedScrollEnabled>
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => onChange(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${opt.label}${opt.sublabel ? `, ${opt.sublabel}` : ''}`}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {selected ? '✓ ' : ''}
                    {opt.label}
                  </Text>
                  {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14, width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  boxError: { borderColor: colors.error },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: '#DBEAFE' },
  optionText: { fontSize: 15, color: colors.text },
  optionTextSelected: { fontWeight: '700', color: colors.primaryDark },
  sublabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  empty: { padding: 12, fontSize: 14, color: colors.textSecondary },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
});
