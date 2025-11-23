import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Card, Heading, Input, Button, Body } from '.';
import { THEME } from '../theme/Theme';

interface AddMemberModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (email: string, role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER') => Promise<void>;
    loading?: boolean;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    visible,
    onClose,
    onAdd,
    loading = false,
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER'>('MEMBER');

    const handleAdd = async () => {
        if (!email.trim()) return;
        await onAdd(email.trim(), role);
        setEmail('');
        setRole('MEMBER');
    };

    const roles: { label: string; value: typeof role }[] = [
        { label: 'Member', value: 'MEMBER' },
        { label: 'Viewer', value: 'VIEWER' },
        { label: 'Project Manager', value: 'PROJECT_MANAGER' },
        { label: 'Admin', value: 'ADMIN' },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            <Card style={styles.card}>
                                <Heading level={3} style={styles.title}>Add Member</Heading>

                                <Input
                                    label="Email Address"
                                    placeholder="Enter user email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />

                                <View style={styles.roleSection}>
                                    <Body style={styles.roleLabel}>Role</Body>
                                    <View style={styles.roleContainer}>
                                        {roles.map((r) => (
                                            <TouchableOpacity
                                                key={r.value}
                                                style={[
                                                    styles.roleChip,
                                                    role === r.value && styles.roleChipActive,
                                                ]}
                                                onPress={() => setRole(r.value)}
                                            >
                                                <Body
                                                    size="sm"
                                                    style={[
                                                        styles.roleText,
                                                        role === r.value && styles.roleTextActive,
                                                    ]}
                                                >
                                                    {r.label}
                                                </Body>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.actions}>
                                    <Button
                                        title="Cancel"
                                        onPress={onClose}
                                        variant="secondary"
                                        style={styles.button}
                                    />
                                    <Button
                                        title="Add"
                                        onPress={handleAdd}
                                        loading={loading}
                                        disabled={!email.trim()}
                                        variant="primary"
                                        style={styles.button}
                                    />
                                </View>
                            </Card>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: THEME.spacing.l,
    },
    container: {
        width: '100%',
    },
    card: {
        padding: THEME.spacing.xl,
    },
    title: {
        marginBottom: THEME.spacing.l,
        textAlign: 'center',
    },
    roleSection: {
        marginTop: THEME.spacing.m,
        marginBottom: THEME.spacing.xl,
    },
    roleLabel: {
        marginBottom: THEME.spacing.s,
        color: THEME.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    roleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: THEME.spacing.s,
    },
    roleChip: {
        paddingHorizontal: THEME.spacing.m,
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.radius.full,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        backgroundColor: THEME.colors.background,
    },
    roleChipActive: {
        borderColor: THEME.colors.primary,
        backgroundColor: THEME.colors.primaryLight,
    },
    roleText: {
        color: THEME.colors.textSecondary,
    },
    roleTextActive: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: THEME.spacing.m,
    },
    button: {
        flex: 1,
    },
});
