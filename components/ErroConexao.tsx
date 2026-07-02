import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErroConexaoProps {
  onTentarNovamente: () => void;
  mensagem?: string;
}

export default function ErroConexao({ onTentarNovamente, mensagem }: ErroConexaoProps) {
  return (
    <View style={styles.containerErro}>
      <Ionicons name="cloud-offline-outline" size={60} color="#949393" />
      <Text style={styles.tituloErro}>Sem conexão ao servidor</Text>
      <Text style={styles.subtituloErro}>
        {mensagem || "Não foi possível carregar os dados. Verifica o Wi-Fi ou dados móveis."}
      </Text>
      
      <TouchableOpacity style={styles.btnTentarNovamente} onPress={onTentarNovamente}>
        <Text style={styles.btnTentarNovamenteTexto}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  containerErro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' },
  tituloErro: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginTop: 15 },
  subtituloErro: { fontSize: 14, color: '#757575', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  btnTentarNovamente: { marginTop: 25, backgroundColor: '#065294', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, elevation: 2 },
  btnTentarNovamenteTexto: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});