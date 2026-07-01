import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isReady, isLoggedIn } = useAuth();

  // Enquanto o AuthProvider valida o token guardado
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#005596" />
      </View>
    );
  }

  // Encaminha conforme a sessão (sem deixar histórico)
  return <Redirect href={isLoggedIn ? '/(protected)/(tabs)/catalogo' : '/login'} />;
}