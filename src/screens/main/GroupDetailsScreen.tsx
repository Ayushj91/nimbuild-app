import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Heading, Body, Card, Avatar, Button, Icon } from '../../components';
import { Restricted } from '../../components/auth/Restricted';
import { Permission } from '../../types/permissions';
import { THEME } from '../../theme/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { groupService } from '../../services/api/groupService';

import { useRequest } from '../../hooks/useRequest';

type GroupDetailsScreenProps = NativeStackScreenProps<MainStackParamList, 'GroupDetails'>;

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({ route, navigation }) => {
    const { groupId } = route.params;

    const {
        request: fetchGroupDetails,
        data: group,
        loading,
    } = useRequest(groupService.getGroupDetails);

    const { request: removeGroupMember } = useRequest(
        groupService.removeGroupMember,
        {
            onSuccess: () => {
                fetchGroupDetails(groupId);
            },
            successMessage: 'Member removed',
        }
    );

    useEffect(() => {
        fetchGroupDetails(groupId);
    }, [groupId]);

    const handleRemoveMember = (userId: string, userName: string) => {
        Alert.alert(
            'Remove Member',
            `Remove ${userName} from this group?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeGroupMember(groupId, userId),
                },
            ]
        );
    };

    if (loading && !group) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    if (!group) {
        return (
            <View style={styles.container}>
                <Body>Group not found</Body>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.card}>
                <Heading level={2} style={styles.groupName}>{group.name}</Heading>
                {group.project && (
                    <Body size="sm" style={styles.projectName}>Project: {group.project.name}</Body>
                )}
            </Card>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Heading level={3}>Members ({group.members?.length || 0})</Heading>
                    <TouchableOpacity onPress={() => navigation.navigate('GroupChat', { groupId })}>
                        <Icon name="message-text" size="base" color={THEME.colors.primary} />
                    </TouchableOpacity>
                </View>

                {group.members?.map((member) => (
                    <Card key={member.id} style={styles.memberCard}>
                        <View style={styles.memberRow}>
                            <Avatar
                                name={member.name}
                                source={member.avatarUrl ? { uri: member.avatarUrl } : undefined}
                                size="sm"
                            />
                            <View style={styles.memberInfo}>
                                <Body style={styles.memberName}>{member.name}</Body>
                                <Body size="sm" style={styles.memberEmail}>
                                    {member.email || member.phone}
                                </Body>
                            </View>
                            {member.id !== group.createdBy.id && group.project?.id && (
                                <Restricted to={Permission.MANAGE_GROUP_MEMBERS} projectId={group.project.id}>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveMember(member.id, member.name || 'this member')}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Icon name="close-circle" size="base" color={THEME.colors.error} />
                                    </TouchableOpacity>
                                </Restricted>
                            )}
                        </View>
                    </Card>
                ))}
            </View>

            <Button
                title="Open Chat"
                onPress={() => navigation.navigate('GroupChat', { groupId })}
                variant="primary"
                fullWidth
                style={styles.button}
                icon={<Icon name="message-text" size="base" color={THEME.colors.white} />}
            />
        </ScrollView>
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
    content: {
        padding: THEME.spacing.l,
    },
    card: {
        padding: THEME.spacing.l,
        marginBottom: THEME.spacing.l,
    },
    groupName: {
        marginBottom: THEME.spacing.xs,
    },
    projectName: {
        color: THEME.colors.primary,
    },
    section: {
        marginBottom: THEME.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.m,
    },
    memberCard: {
        marginBottom: THEME.spacing.s,
        padding: THEME.spacing.m,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberInfo: {
        flex: 1,
        marginLeft: THEME.spacing.m,
    },
    memberName: {
        fontWeight: '600',
    },
    memberEmail: {
        fontSize: 12,
        color: THEME.colors.textSecondary,
    },
    button: {
        marginBottom: THEME.spacing.l,
    },
});
