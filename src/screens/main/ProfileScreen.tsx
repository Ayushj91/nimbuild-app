import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Heading, Body, Card, Button, Avatar, Icon } from '../../components';
import { THEME } from '../../theme/Theme';
import { useAuthStore } from '../../store/authStore';
import { useRequest } from '../../hooks/useRequest';
import { userService } from '../../services/api/userService';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useToast } from '../../contexts/ToastContext';

export const ProfileScreen: React.FC = () => {
    const { user, setUser, logout } = useAuthStore();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [name, setName] = useState(user?.name || '');
    const [companyName, setCompanyName] = useState(user?.companyName || '');
    const [role, setRole] = useState(user?.role || '');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<any>(null);

    // Update local state when user changes (e.g. after save)
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setCompanyName(user.companyName || '');
            setRole(user.role || '');
        }
    }, [user]);

    const { request: updateProfile, loading: updating } = useRequest(userService.updateMe, {
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setIsEditing(false);
            toast.showToast({ message: 'Profile updated successfully', type: 'success' });
        },
        successMessage: 'Profile updated',
    });

    const { request: uploadAvatar, loading: uploading } = useRequest(userService.uploadAvatar, {
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setAvatarUri(null);
            setAvatarFile(null);
            toast.showToast({ message: 'Avatar updated successfully', type: 'success' });
        },
    });

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        // 1. Update Profile Details
        await updateProfile({
            name: name.trim(),
            companyName: companyName.trim() || undefined,
            role: role.trim() || undefined,
        });

        // 2. Upload Avatar if changed
        if (avatarFile) {
            const formData = new FormData();
            formData.append('file', {
                uri: avatarFile.uri,
                type: avatarFile.type,
                name: avatarFile.fileName,
            } as any);
            await uploadAvatar(formData);
        }
    };

    const handleCamera = async () => {
        launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: true }, (response) => {
            if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                setAvatarUri(asset.uri || null);
                setAvatarFile(asset);
            }
        });
    };

    const handleGallery = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                setAvatarUri(asset.uri || null);
                setAvatarFile(asset);
            }
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form
        if (user) {
            setName(user.name || '');
            setCompanyName(user.companyName || '');
            setRole(user.role || '');
        }
        setAvatarUri(null);
        setAvatarFile(null);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.profileCard}>
                <View style={styles.header}>
                    <Heading level={2}>My Profile</Heading>
                    {!isEditing && (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Icon name="pencil" size="base" color={THEME.colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        {avatarUri ? (
                            <Avatar name={name} source={{ uri: avatarUri }} size="xl" />
                        ) : (
                            <Avatar name={user?.name} source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined} size="xl" />
                        )}
                        {isEditing && (
                            <View style={styles.editAvatarOverlay}>
                                <TouchableOpacity style={styles.avatarBtn} onPress={handleCamera}>
                                    <Icon name="camera" size="sm" color={THEME.colors.white} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.avatarBtn} onPress={handleGallery}>
                                    <Icon name="image" size="sm" color={THEME.colors.white} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    {!isEditing && (
                        <View style={styles.userInfo}>
                            <Heading level={2} style={styles.name}>{user?.name}</Heading>
                            <Body style={styles.role}>{user?.role || 'No Role'}</Body>
                            <Body size="sm" style={styles.company}>{user?.companyName || 'No Company'}</Body>
                        </View>
                    )}
                </View>

                {isEditing ? (
                    <View style={styles.form}>
                        <View style={styles.field}>
                            <Body style={styles.label}>Full Name</Body>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={THEME.colors.textTertiary}
                            />
                        </View>
                        <View style={styles.field}>
                            <Body style={styles.label}>Company</Body>
                            <TextInput
                                style={styles.input}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="Company Name"
                                placeholderTextColor={THEME.colors.textTertiary}
                            />
                        </View>
                        <View style={styles.field}>
                            <Body style={styles.label}>Role</Body>
                            <TextInput
                                style={styles.input}
                                value={role}
                                onChangeText={setRole}
                                placeholder="Job Title / Role"
                                placeholderTextColor={THEME.colors.textTertiary}
                            />
                        </View>

                        <View style={styles.actionButtons}>
                            <Button
                                title="Cancel"
                                onPress={handleCancel}
                                variant="secondary"
                                style={styles.cancelBtn}
                            />
                            <Button
                                title="Save Changes"
                                onPress={handleSave}
                                loading={updating || uploading}
                                variant="primary"
                                style={styles.saveBtn}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.details}>
                        <View style={styles.detailItem}>
                            <Icon name="email" size="base" color={THEME.colors.textSecondary} />
                            <Body style={styles.detailText}>{user?.email || 'No Email'}</Body>
                        </View>
                        <View style={styles.detailItem}>
                            <Icon name="phone" size="base" color={THEME.colors.textSecondary} />
                            <Body style={styles.detailText}>{user?.phone || 'No Phone'}</Body>
                        </View>
                    </View>
                )}
            </Card>

            <Button
                title="Logout"
                variant="secondary"
                onPress={logout}
                fullWidth
                style={styles.logoutBtn}
            />
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
    profileCard: {
        padding: THEME.spacing.xl,
        marginBottom: THEME.spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.l,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: THEME.spacing.l,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: THEME.spacing.m,
    },
    editAvatarOverlay: {
        position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: THEME.spacing.s,
    },
    avatarBtn: {
        backgroundColor: THEME.colors.primary,
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: THEME.colors.white,
    },
    userInfo: {
        alignItems: 'center',
    },
    name: {
        marginTop: THEME.spacing.s,
    },
    role: {
        color: THEME.colors.textSecondary,
        marginTop: 2,
    },
    company: {
        color: THEME.colors.textTertiary,
        marginTop: 2,
    },
    form: {
        marginTop: THEME.spacing.m,
    },
    field: {
        marginBottom: THEME.spacing.m,
    },
    label: {
        marginBottom: THEME.spacing.xs,
        color: THEME.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    input: {
        backgroundColor: THEME.colors.backgroundGray,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderRadius: THEME.radius.base,
        padding: THEME.spacing.m,
        color: THEME.colors.text,
        fontSize: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: THEME.spacing.m,
        marginTop: THEME.spacing.m,
    },
    cancelBtn: {
        flex: 1,
    },
    saveBtn: {
        flex: 1,
    },
    details: {
        marginTop: THEME.spacing.m,
        paddingTop: THEME.spacing.m,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.borderLight,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.m,
        gap: THEME.spacing.m,
    },
    detailText: {
        color: THEME.colors.text,
    },
    logoutBtn: {
        marginTop: 'auto',
    },
});
