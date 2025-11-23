import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Heading, Body, Card, Badge } from '../../components';
import { THEME } from '../../theme/Theme';

export const TasksScreen: React.FC = () => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Heading level={2}>My Tasks</Heading>
            <Body style={styles.subtitle}>Tasks assigned to you</Body>

            <Card style={styles.taskCard} onPress={() => { }}>
                <View style={styles.taskHeader}>
                    <Heading level={3}>Design Login Screen</Heading>
                    <Badge value="High" variant="error" />
                </View>
                <Body size="sm" style={styles.description}>
                    Create mockups for the login screen
                </Body>
                <Body size="sm" style={styles.project}>
                    Mobile App Development
                </Body>
            </Card>

            <Card style={styles.taskCard} onPress={() => { }}>
                <View style={styles.taskHeader}>
                    <Heading level={3}>Update Documentation</Heading>
                    <Badge value="Low" variant="info" />
                </View>
                <Body size="sm" style={styles.description}>
                    Update project README with latest changes
                </Body>
                <Body size="sm" style={styles.project}>
                    Website Redesign
                </Body>
            </Card>

            <Card style={styles.taskCard} onPress={() => { }}>
                <View style={styles.taskHeader}>
                    <Heading level={3}>Review Pull Request</Heading>
                    <Badge value="Med" variant="warning" />
                </View>
                <Body size="sm" style={styles.description}>
                    Review and merge feature branch
                </Body>
                <Body size="sm" style={styles.project}>
                    Mobile App Development
                </Body>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.backgroundGray,
    },
    content: {
        padding: THEME.spacing.l,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.l,
    },
    taskCard: {
        padding: THEME.spacing.l,
        marginBottom: THEME.spacing.m,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: THEME.spacing.s,
    },
    description: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.m,
    },
    project: {
        color: THEME.colors.primary,
        fontWeight: THEME.typography.fontWeight.medium,
    },
});
