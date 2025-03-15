import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,  // This hides the header completely
        title: '',           // This removes any title text
        headerStyle: {
        },
        contentStyle: {
          backgroundColor: 'transparent'
        },
        animation: 'none'
      }}
    />
  );
}