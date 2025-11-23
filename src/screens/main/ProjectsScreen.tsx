import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Heading, Body, Card, Button, Icon, EmptyState } from '../../components';
import { THEME } from '../../theme/Theme';
import { ProjectsScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { projectService } from '../../services/api/projectService';
import { useFocusEffect } from '@react-navigation/native';

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ navigation }) => {
    const {
        request: fetchProjects,
        data: projects,
        loading,
    } = useRequest(projectService.getProjects);

    useFocusEffect(
        useCallback(() => {
            fetchProjects();
        }, [])
    );

    const renderItem = ({ item }: { item: any }) => (
        <Card
            style={styles.projectCard}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}>
            <Heading level={3}>{item.name}</Heading>
            {item.description && (
                <Body size="sm" style={styles.description}>
                    {item.description}
                </Body>
            )}
            <View style={styles.stats}>
                <Body size="sm">Created by {item.createdBy.name}</Body>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            {loading && !projects ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={projects || []}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchProjects} />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="folder-outline"
                            title="No projects yet"
                            message="Create your first project to start managing tasks and blueprints."
                            actionLabel="Create Project"
                            onAction={() => navigation.navigate('CreateProject')}
                            style={styles.emptyState}
                        />
                    }
                />
            )}

            <Button
                title=""
                icon={<Icon name="plus" size="lg" color={THEME.colors.white} />}
                onPress={() => navigation.navigate('CreateProject')}
                style={styles.fab}
                variant="primary"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.backgroundGray,
    },
    projectCard: {
        padding: THEME.spacing.l,
        marginBottom: THEME.spacing.m,
        borderRadius: THEME.radius.base,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    description: {
        color: THEME.colors.textSecondary,
        marginTop: THEME.spacing.s,
        lineHeight: 20,
    },
    stats: {
        marginTop: THEME.spacing.m,
        paddingTop: THEME.spacing.m,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: THEME.spacing.l,
        paddingBottom: 100, // Space for FAB
        flexGrow: 1,
    },
    emptyState: {
        marginTop: THEME.spacing['2xl'],
    },
    fab: {
        position: 'absolute',
        bottom: THEME.spacing.xl,
        right: THEME.spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0, // Override default button padding
        elevation: 6,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
});
