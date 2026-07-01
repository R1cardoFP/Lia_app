import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from "@/hooks/useAuth";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
 

export default function ProtectedLayout() { 

   const { isLoggedIn, isReady } = useAuth(); // 4. Extrai as variáveis do contexto
  const colorScheme = useColorScheme(); 

  // 5. Faz as validações ANTES de renderizar o ecrã
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#065294" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }
 
  return ( 
    
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> 
      <Stack> 
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 


      <Stack.Screen 
          name="detalhes/[id]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        /> 


        <Stack.Screen 
          name="verReserva/[id]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        /> 
      </Stack>
<StatusBar style="auto" /> 
</ThemeProvider> 

); 
}
