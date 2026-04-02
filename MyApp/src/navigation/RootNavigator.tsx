import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import BottomTabNavigator from './BottomTabNavigator';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import SearchFiltersScreen from '../screens/SearchFiltersScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="SearchFilters" component={SearchFiltersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
