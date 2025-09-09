import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';

const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    primaryContainer: '#BB86FC',
    secondary: '#03DAC6',
    background: '#f5f5f5',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
            />
            <Stack.Screen 
              name="AddItem" 
              component={AddItemScreen} 
            />
            <Stack.Screen 
              name="ItemDetail" 
              component={ItemDetailScreen} 
            />
            <Stack.Screen 
              name="GroupDetail" 
              component={GroupDetailScreen} 
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
