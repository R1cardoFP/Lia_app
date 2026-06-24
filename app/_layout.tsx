import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
 
import { useColorScheme } from '@/hooks/use-color-scheme';
 
export const unstable_settings = { 
  anchor: '(tabs)', 
}; 
 
export default function RootLayout() { 
  const colorScheme = useColorScheme(); 
 
  return ( 
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> 
      <Stack> 
        <Stack.Screen name="login"   options={{  
            headerShown: true,               
            headerTitle: '',                   
            headerStyle: { 
              backgroundColor: '#065294',      
            }, 
            headerShadowVisible: false,        
                   
          }} /> 
        <Stack.Screen  
          name="register"  
          options={{  
            headerShown: true,               
            headerTitle: '',                   
            headerStyle: { 
              backgroundColor: '#00a385',      
            }, 
            headerShadowVisible: false,        
            headerTintColor: '#fff',          // Torna a seta nativa de voltar atrás BRANCA 
          }} 
        /> 
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> 
      </Stack> 
<StatusBar style="auto" /> 
</ThemeProvider> 
); 
}
