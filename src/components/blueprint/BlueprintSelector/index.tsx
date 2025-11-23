import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Heading, Body, Button, Icon } from '../../../components';
import { THEME } from '../../../theme/Theme';
import { Blueprint } from '../../../types/api';
import { useRequest } from '../../../hooks/useRequest';
import { blueprintService } from '../../../services/api/blueprintService';
import { pick, types } from '@react-native-documents/picker';

interface BlueprintSelectorProps {
    visible: boolean;
    projectId: string;
    onSelect: (blueprint: Blueprint) => void;
    onClose: () => void;
}

export const BlueprintSelector: React.FC<BlueprintSelectorProps> = ({
    visible,
    projectId,
    onSelect,
    onClose,
}) => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);

    const { request: fetchBlueprints, loading: loadingBlueprints } = useRequest(
        blueprintService.listBlueprints,
        {
            onSuccess: (response) => {
                setBlueprints(response.blueprints);
            },
        }
    );

    const { request: uploadBlueprint, loading: uploading } = useRequest(
        blueprintService.uploadBlueprint,
        {
            onSuccess: (blueprint) => {
                setBlueprints([blueprint, ...blueprints]);
                setSelectedBlueprint(blueprint);
            },
            successMessage: 'Blueprint uploaded successfully',
        }
    );

    useEffect(() => {
        if (visible && projectId) {
            fetchBlueprints(projectId, { limit: 50 });
        }
    }, [projectId, fetchBlueprints, visible]);

    const handleUpload = async () => {
        try {
            const results = await pick({
                type: [types.allFiles],
                allowMultiSelection: false,
            });

            if (results && results[0]) {
                const file = {
                    uri: results[0].uri,
                    type: results[0].type || 'application/octet-stream',
                    name: results[0].name || 'blueprint',
                };
                uploadBlueprint(projectId, file);
            }
        } catch (err: any) {
            if (err.code === 'DOCUMENT_PICKER_CANCELED') {
                // User cancelled
            } else {
                console.error('Blueprint upload error:', err);
            }
        }
    };

    const handleSelectAndContinue = () => {
        if (selectedBlueprint) {
            onSelect(selectedBlueprint);
        }
    };

    const renderBlueprintItem = ({ item }: { item: Blueprint }) => {
        const isSelected = selectedBlueprint?.id === item.id;
        const isPDF = item.fileType === 'pdf';

        return (
            <TouchableOpacity
                style={[styles.blueprintItem, isSelected && styles.blueprintItemSelected]}
                onPress={() => setSelectedBlueprint(item)}>
                <View style={styles.blueprintPreview}>
                    {item.thumbnailUrl ? (
                        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
                    ) : (
                        <View style={styles.placeholderThumbnail}>
                            <Icon
                                name={isPDF ? 'file-pdf' : 'image'}
                                size="lg"
                                color={THEME.colors.textSecondary}
                            />
                        </View>
                    )}
                </View>
                <View style={styles.blueprintInfo}>
                    <Body numberOfLines={1} style={styles.blueprintName}>
                        {item.filename}
                    </Body>
                    <Body size="sm" style={styles.blueprintMeta}>
                        {item.markerCount || 0} markers • {formatFileSize(item.fileSize)}
                    </Body>
                </View>
                {isSelected && (
                    <Icon name="check-circle" size="base" color={THEME.colors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Heading level={3}>Select Blueprint</Heading>
                    <TouchableOpacity onPress={onClose}>
                        <Icon name="close" size="lg" color={THEME.colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {loadingBlueprints ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={THEME.colors.primary} />
                        </View>
                    ) : blueprints.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon
                                name="file-document-outline"
                                size="xl"
                                color={THEME.colors.textTertiary}
                            />
                            <Body style={styles.emptyText}>No blueprints yet</Body>
                            <Body size="sm" style={styles.emptySubtext}>
                                Upload a blueprint to get started
                            </Body>
                        </View>
                    ) : (
                        <FlatList
                            data={blueprints}
                            renderItem={renderBlueprintItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Upload New Blueprint"
                        onPress={handleUpload}
                        variant="secondary"
                        loading={uploading}
                        icon={<Icon name="upload" size="sm" color={THEME.colors.primary} />}
                        style={styles.uploadButton}
                    />
                    <Button
                        title="Select & Continue"
                        onPress={handleSelectAndContinue}
                        variant="primary"
                        disabled={!selectedBlueprint || uploading}
                        style={styles.continueButton}
                    />
                </View>
            </View>
        </Modal>
    );
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
        backgroundColor: THEME.colors.white,
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: THEME.spacing.m,
    },
    blueprintItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.white,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: THEME.colors.border,
        marginBottom: THEME.spacing.m,
    },
    blueprintItemSelected: {
        borderColor: THEME.colors.primary,
        backgroundColor: THEME.colors.primaryLight,
    },
    blueprintPreview: {
        width: 60,
        height: 60,
        marginRight: THEME.spacing.m,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: THEME.colors.surface,
    },
    placeholderThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: THEME.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderStyle: 'dashed',
    },
    blueprintInfo: {
        flex: 1,
        marginRight: THEME.spacing.m,
    },
    blueprintName: {
        fontWeight: '600',
        marginBottom: 4,
    },
    blueprintMeta: {
        color: THEME.colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.xl,
    },
    emptyText: {
        marginTop: THEME.spacing.m,
        fontSize: 18,
        fontWeight: '600',
        color: THEME.colors.textSecondary,
    },
    emptySubtext: {
        marginTop: THEME.spacing.xs,
        color: THEME.colors.textTertiary,
        textAlign: 'center',
    },
    footer: {
        padding: THEME.spacing.l,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        backgroundColor: THEME.colors.white,
        gap: THEME.spacing.m,
    },
    uploadButton: {
        width: '100%',
    },
    continueButton: {
        width: '100%',
    },
});
