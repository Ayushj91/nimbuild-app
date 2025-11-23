import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Input, Heading, Card } from '../../components';
import { THEME } from '../../theme/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { groupService } from '../../services/api/groupService';

type CreateGroupScreenProps = NativeStackScreenProps<MainStackParamList, 'CreateGroup'>;

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ navigation, route }) => {
    const { projectId } = route.params || {};
    const [name, setName] = useState('');

    const { request: createGroup, loading } = useRequest(
        groupService.createGroup,
        {
            onSuccess: (group) => {
                navigation.replace('GroupChat', { groupId: group.id });
            },
            successMessage: 'Group created successfully',
        }
    );

    const handleCreate = () => {
        if (name.trim()) {
            createGroup({
                name: name.trim(),
                projectId,
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Heading level={3} style={styles.title}>Create New Group</Heading>

                    <Input
                        label="Group Name"
                        placeholder="Enter group name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoFocus
                    />

                    <Button
                        title="Create Group"
                        onPress={handleCreate}
                        loading={loading}
                        disabled={!name.trim()}
                        fullWidth
                        style={styles.button}
                    />
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        padding: THEME.spacing.l,
    },
    card: {
        padding: THEME.spacing.xl,
    },
    title: {
        marginBottom: THEME.spacing.l,
    },
    button: {
        marginTop: THEME.spacing.m,
    },
});
