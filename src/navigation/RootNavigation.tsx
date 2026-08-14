import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateAcademyScreen, LoginScreen } from '../screens';
import AdminTabs from './AdminNavigator';
import MainTabs from './StudentNavigator';

const RootStack = createNativeStackNavigator({
  initialRouteName: 'Login',
  screenOptions: { headerShown: false },
  screens: {
    Login: { screen: LoginScreen },
    Main: { screen: MainTabs },
    Admin: { screen: AdminTabs },
    CreateAcademy: { screen: CreateAcademyScreen },
  },
});

const Navigation = createStaticNavigation(RootStack);

export default Navigation;
