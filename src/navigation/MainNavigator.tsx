import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerParamList } from './types';
import { ProjectDashboardScreen } from '../screens/main/ProjectDashboardScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { CreateProjectScreen } from '../screens/main/CreateProjectScreen';
import { DrawerContent } from './DrawerContent';
import { THEME } from '../theme/Theme';

const Drawer = createDrawerNavigator<DrawerParamList>();

export const MainNavigator: React.FC = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: THEME.colors.surface,
                },
                headerTintColor: THEME.colors.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                drawerType: 'front',
            }}
        >
            <Drawer.Screen
                name="ProjectDashboard"
                component={ProjectDashboardScreen}
                options={{ title: 'Dashboard' }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
            <Drawer.Screen
                name="CreateProject"
                component={CreateProjectScreen}
                options={{ title: 'Create Project' }}
            />
        </Drawer.Navigator>
    );
};
