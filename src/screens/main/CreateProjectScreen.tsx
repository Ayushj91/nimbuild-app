import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Card, Input } from '../../components';
import { THEME } from '../../theme/Theme';
import { CreateProjectScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { projectService } from '../../services/api/projectService';

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({
    navigation,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const { request: createProject, loading } = useRequest(
        projectService.createProject,
        {
            onSuccess: () => {
                navigation.goBack();
            },
            successMessage: 'Project created successfully',
        }
    );

    const handleCreate = () => {
        if (name.trim()) {
            createProject({
                name: name.trim(),
                description: description.trim() || undefined,
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Input
                        label="Project Name"
                        placeholder="Enter project name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <Input
                        label="Description"
                        placeholder="Enter project description (optional)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        style={styles.textArea}
                    />

                    <Button
                        title="Create Project"
                        onPress={handleCreate}
                        loading={loading}
                        disabled={!name.trim()}
                        fullWidth
                        style={styles.button}
                    />
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        flex: 1,
        padding: THEME.spacing.l,
    },
    card: {
        padding: THEME.spacing.xl,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    button: {
        marginTop: THEME.spacing.m,
    },
});
