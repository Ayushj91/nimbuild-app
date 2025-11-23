import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Heading, Body, Card, Icon, Button } from '../../components';
import { THEME } from '../../theme/Theme';

import { groupService } from '../../services/api/groupService';
import { Group } from '../../types/api';
import { useRequest } from '../../hooks/useRequest';
import { useFocusEffect } from '@react-navigation/native';

import { GroupsScreenProps, GroupsListScreenProps } from '../../navigation/types';

type GroupsListScreenNewProps = GroupsScreenProps | GroupsListScreenProps;

export const GroupsListScreen: React.FC<GroupsListScreenNewProps> = ({ navigation }) => {
    const {
        request: fetchGroups,
        data: groups,
        loading,
    } = useRequest(groupService.getUserGroups);

    useFocusEffect(
        React.useCallback(() => {
            fetchGroups();
        }, [])
    );

    const renderItem = ({ item }: { item: Group }) => (
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('GroupChat', { groupId: item.id })}>
            <Card style={styles.groupCard} shadow="sm">
                <View style={styles.groupHeader}>
                    <View style={styles.groupIcon}>
                        <Icon name="account-group" size="lg" color={THEME.colors.primary} />
                    </View>
                    <View style={styles.groupInfo}>
                        <Heading level={3}>{item.name}</Heading>
                        {item.project && (
                            <Body size="sm" style={styles.projectName}>
                                {item.project.name}
                            </Body>
                        )}
                        <Body size="sm" style={styles.memberCount}>
                            {item.members?.length || 0} members
                        </Body>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.getParent()?.navigate('GroupDetails', { groupId: item.id })}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="information-outline" size="base" color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && !groups ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={groups || []}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="account-group-outline" size="xl" color={THEME.colors.textSecondary} />
                            <Body style={styles.emptyText}>No groups yet. Create one to get started!</Body>
                        </View>
                    }
                />
            )}

            <Button
                title=""
                icon={<Icon name="plus" size="lg" color={THEME.colors.white} />}
                onPress={() => navigation.getParent()?.navigate('CreateGroup')}
                style={styles.fab}
                variant="primary"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: THEME.spacing.l,
        paddingBottom: 100,
        flexGrow: 1,
    },
    groupCard: {
        padding: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.m,
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: THEME.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupInfo: {
        flex: 1,
    },
    projectName: {
        color: THEME.colors.primary,
        marginTop: 2,
    },
    memberCount: {
        color: THEME.colors.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: THEME.spacing['2xl'],
    },
    emptyText: {
        marginTop: THEME.spacing.m,
        color: THEME.colors.textSecondary,
        textAlign: 'center',
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
        paddingHorizontal: 0,
        elevation: 6,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
});
