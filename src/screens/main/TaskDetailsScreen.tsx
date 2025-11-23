import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Heading, Body, Card, Avatar, Badge, Button, Icon, Caption, ThreadedComment, AssignmentChain } from '../../components';
import { THEME } from '../../theme/Theme';
import { TaskDetailsScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { taskService } from '../../services/api/taskService';
import { commentService } from '../../services/api/commentService';
import { blueprintService } from '../../services/api/blueprintService';
import { TaskStatus, Blueprint, AttachmentResponse, Comment } from '../../types/api';
import { BlueprintViewer } from '../../components/blueprint/BlueprintViewer';
import { downloadFile } from '../../services/downloadService';
import { useToast } from '../../contexts/ToastContext';
import { useProjectPermission } from '../../hooks/usePermission';
import { Permission } from '../../types/permissions';

export const TaskDetailsScreen: React.FC<TaskDetailsScreenProps> = ({
    route,
    navigation,
}) => {
    const { projectId, taskId } = route.params;
    const { can } = useProjectPermission(projectId);

    const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
    const [showBlueprintViewer, setShowBlueprintViewer] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
    const [replyingToCommentId, setReplyingToCommentId] = useState<string | undefined>();
    const [selectedImage, setSelectedImage] = useState<AttachmentResponse | null>(null);
    const toast = useToast();



    const {
        request: fetchDetails,
        data: task,
        loading,
    } = useRequest(taskService.getTaskDetails);

    const { request: updateTaskRequest, loading: updating } = useRequest(
        taskService.updateTask,
        {
            onSuccess: () => {
                fetchDetails(projectId, taskId);
            },
            successMessage: 'Task updated',
        }
    );

    const { request: createCommentRequest, loading: commenting } = useRequest(
        commentService.createComment,
        {
            onSuccess: () => {
                setNewCommentText('');
                fetchDetails(projectId, taskId);
            },
            successMessage: 'Comment added',
        }
    );



    const { request: fetchBlueprint } = useRequest(
        blueprintService.getBlueprint,
        {
            onSuccess: (data) => setBlueprint(data),
        }
    );

    // Organize comments into threads
    const topLevelComments = useMemo(() => {
        if (!task?.comments) return [];

        // Deep copy to avoid mutating original data
        const comments = JSON.parse(JSON.stringify(task.comments)) as Comment[];
        const commentMap = new Map<string, Comment>();
        const roots: Comment[] = [];

        // First pass: map all comments
        comments.forEach(comment => {
            comment.replies = []; // Initialize replies array
            commentMap.set(comment.id, comment);
        });

        // Second pass: link children to parents
        comments.forEach(comment => {
            if (comment.replyToCommentId) {
                const parent = commentMap.get(comment.replyToCommentId);
                if (parent) {
                    if (!parent.replies) parent.replies = [];
                    parent.replies.push(comment);
                    // Update reply count if needed
                    parent.replyCount = (parent.replyCount || 0) + 1;
                } else {
                    // Orphaned reply (parent not found), treat as root
                    roots.push(comment);
                }
            } else {
                roots.push(comment);
            }
        });

        // Sort by date (newest first for roots, oldest first for replies)
        roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Recursive sort for replies
        const sortReplies = (c: Comment) => {
            if (c.replies && c.replies.length > 0) {
                c.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                c.replies.forEach(sortReplies);
            }
        };
        roots.forEach(sortReplies);

        return roots;
    }, [task?.comments]);

    useEffect(() => {
        fetchDetails(projectId, taskId);
    }, [projectId, taskId]);

    useEffect(() => {
        if (task?.blueprintId) {
            fetchBlueprint(projectId, task.blueprintId);
        }
        if (task) {
            setIsWatching(!!task.isWatching);
        }
    }, [task, projectId]);





    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'DONE':
                return 'success';
            case 'WIP':
            case 'IN_PROGRESS':
                return 'info';
            case 'BLOCKED':
                return 'error';
            case 'INSPECTION':
                return 'warning';
            default:
                return 'primary';
        }
    };

    const getCategoryColor = (category?: string) => {
        switch (category) {
            case 'SNAG':
                return 'warning';
            case 'QUALITY_ISSUE':
                return 'error';
            case 'EHS_ISSUE':
                return 'error';
            default:
                return 'info';
        }
    };

    const handleStatusChange = (newStatus: TaskStatus) => {
        updateTaskRequest(projectId, taskId, { status: newStatus });
    };



    const handleDeleteTask = useCallback(() => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await taskService.deleteTask(projectId, taskId);
                            toast.showToast({ message: 'Task deleted successfully', type: 'success' });
                            navigation.goBack();
                        } catch (error: any) {
                            toast.showToast({ message: error.message || 'Failed to delete task', type: 'error' });
                        }
                    },
                },
            ]
        );
    }, [projectId, taskId, navigation, toast]);

    const handleToggleWatch = useCallback(async () => {
        if (watchLoading) return;

        setWatchLoading(true);
        try {
            let updatedTask;
            if (isWatching) {
                updatedTask = await taskService.unwatchTask(projectId, taskId);
                toast.showToast({ message: 'Stopped watching task', type: 'info' });
            } else {
                updatedTask = await taskService.watchTask(projectId, taskId);
                toast.showToast({ message: 'Now watching task', type: 'success' });
            }

            if (updatedTask) {
                setIsWatching(updatedTask.isWatching || false);
            }
        } catch (error: any) {
            console.error('Failed to toggle watch:', error);
            toast.showToast({ message: 'Failed to update watch status', type: 'error' });
        } finally {
            setWatchLoading(false);
        }
    }, [watchLoading, isWatching, projectId, taskId, toast]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleDownloadAttachment = async (url: string, filename: string) => {
        const fileId = `${url}_${filename} `;
        if (downloadingFiles.has(fileId)) {
            return; // Already downloading
        }

        setDownloadingFiles(prev => new Set(prev).add(fileId));

        try {
            const result = await downloadFile(url, filename);
            if (result.success) {
                toast.showToast({ message: `Downloaded: ${filename} `, type: 'success' });
            } else {
                toast.showToast({ message: result.error || 'Download failed', type: 'error' });
            }
        } catch (error: any) {
            toast.showToast({ message: error.message || 'Download failed', type: 'error' });
        } finally {
            setDownloadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileId);
                return newSet;
            });
        }
    };

    const handleDownloadAsset = (asset: AttachmentResponse) => {
        return handleDownloadAttachment(asset.downloadUrl, asset.filename);
    };

    // Organize comments into threads (filter to show only top-level comments)


    const handleReplyToComment = (commentId: string) => {
        setReplyingToCommentId(commentId);
        // Optionally scroll to comment input
    };

    const handleCancelReply = () => {
        setReplyingToCommentId(undefined);
    };

    const handleAddComment = useCallback(() => {
        if (!newCommentText.trim()) return;

        createCommentRequest(projectId, taskId, {
            body: newCommentText.trim(),
            replyToCommentId: replyingToCommentId,
        });

        setReplyingToCommentId(undefined);
    }, [newCommentText, projectId, taskId, replyingToCommentId, createCommentRequest]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            // eslint-disable-next-line react/no-unstable-nested-components
            headerRight: () => (
                <TaskDetailsHeaderRight
                    isWatching={isWatching}
                    watchLoading={watchLoading}
                    onToggleWatch={handleToggleWatch}
                    onDelete={handleDeleteTask}
                    onEdit={() => navigation.navigate('EditTask', { projectId, taskId })}
                    canEdit={can(Permission.UPDATE_TASK)}
                    canDelete={can(Permission.DELETE_TASK)}
                />
            ),
        });
    }, [navigation, projectId, taskId, isWatching, watchLoading, handleDeleteTask, handleToggleWatch, can]);



    if (loading && !task) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    if (!task) {
        return (
            <View style={styles.container}>
                <Body>Task not found</Body>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Header with badges */}
                    <View style={styles.header}>
                        <View style={styles.badges}>
                            <Badge
                                value={task.status}
                                variant={getStatusColor(task.status)}
                                style={styles.badge}
                            />
                            {task.category && (
                                <Badge
                                    value={task.category}
                                    variant={getCategoryColor(task.category)}
                                    style={styles.badge}
                                />
                            )}
                        </View>
                        <Body size="sm" style={styles.date}>
                            Created {formatDate(task.createdAt)}
                        </Body>
                    </View>

                    {/* Title */}
                    <Heading level={2} style={styles.title}>
                        {task.title}
                    </Heading>

                    {/* Description */}
                    {task.description && (
                        <Body style={styles.description}>{task.description}</Body>
                    )}

                    {/* Location */}
                    {task.location && (
                        <View style={styles.locationRow}>
                            <Icon
                                name="map-marker"
                                size="sm"
                                color={THEME.colors.textSecondary}
                            />
                            <Body style={styles.locationText}>{task.location}</Body>
                        </View>
                    )}

                    {/* Blueprint */}
                    {task.blueprintId && blueprint && (
                        <TouchableOpacity
                            style={styles.blueprintCard}
                            onPress={() => setShowBlueprintViewer(true)}>
                            <View style={styles.blueprintHeader}>
                                <Icon
                                    name="file-document-outline"
                                    size="lg"
                                    color={THEME.colors.primary}
                                />
                                <View style={styles.blueprintInfo}>
                                    <Body style={styles.blueprintTitle}>Blueprint Location</Body>
                                    <Body size="sm" style={styles.blueprintFilename}>
                                        {blueprint.filename}
                                    </Body>
                                </View>
                                <Icon
                                    name="chevron-right"
                                    size="sm"
                                    color={THEME.colors.textSecondary}
                                />
                            </View>
                            {blueprint.thumbnailUrl && (
                                <Image
                                    source={{ uri: blueprint.thumbnailUrl }}
                                    style={styles.blueprintThumbnail}
                                    resizeMode="cover"
                                />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Details Section */}
                    <View style={styles.section}>
                        <Heading level={3} style={styles.sectionTitle}>
                            Details
                        </Heading>
                        <Card style={styles.detailsCard}>
                            {task.assignedToName && (
                                <View style={styles.detailRow}>
                                    <Body style={styles.label}>Assigned To:</Body>
                                    <View style={styles.assigneeInfo}>
                                        <Avatar
                                            name={task.assignedToName}
                                            size="sm"
                                        />
                                        <Body>{task.assignedToName}</Body>
                                    </View>
                                </View>
                            )}
                            {task.ccUsers && task.ccUsers.length > 0 && (
                                <View style={styles.detailRow}>
                                    <Body style={styles.label}>CC:</Body>
                                    <View style={styles.ccUsers}>
                                        {task.ccUsers.map((user) => (
                                            <View key={user.id} style={styles.ccUserItem}>
                                                <Avatar
                                                    name={user.name}
                                                    size="sm"
                                                />
                                                <Body size="sm">{user.name}</Body>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Assignment Chain */}
                            <AssignmentChain projectId={projectId} taskId={taskId} />

                            <View style={styles.detailRow}>
                                <Body style={styles.label}>Due Date:</Body>
                                <Body>{formatDate(task.dueDate)}</Body>
                            </View>
                            <View style={styles.detailRow}>
                                <Body style={styles.label}>Priority:</Body>
                                <Body>{task.priority || 'None'}</Body>
                            </View>
                            {task.startDate && (
                                <View style={styles.detailRow}>
                                    <Body style={styles.label}>Start Date:</Body>
                                    <Body>{formatDate(task.startDate)}</Body>
                                </View>
                            )}
                            {task.finishDate && (
                                <View style={styles.detailRow}>
                                    <Body style={styles.label}>Finish Date:</Body>
                                    <Body>{formatDate(task.finishDate)}</Body>
                                </View>
                            )}
                            {task.duration && (
                                <View style={styles.detailRow}>
                                    <Body style={styles.label}>Duration:</Body>
                                    <Body>
                                        {task.duration} {task.unit || 'hours'}
                                    </Body>
                                </View>
                            )}
                            {task.quantity && (
                                <View style={styles.detailRow}>
                                    <Body style={styles.label}>Quantity:</Body>
                                    <Body>
                                        {task.quantity} {task.unit || 'units'}
                                    </Body>
                                </View>
                            )}
                            <View style={styles.detailRow}>
                                <Body style={styles.label}>Created By:</Body>
                                <Body>{task.createdByName}</Body>
                            </View>
                        </Card>
                    </View>

                    {/* Assets Section */}
                    {task.assets && task.assets.length > 0 && (
                        <View style={styles.section}>
                            <Heading level={3} style={styles.sectionTitle}>
                                Assets ({task.assets.length})
                            </Heading>
                            <Card>
                                <View style={styles.assetsGrid}>
                                    {task.assets.map((asset, index) => {
                                        const fileId = `${asset.downloadUrl}_${asset.filename}`;
                                        const isDownloading = downloadingFiles.has(fileId);
                                        const isImage = asset.type === 'image';

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.assetCard}
                                                onPress={() => isImage ? setSelectedImage(asset) : handleDownloadAsset(asset)}
                                                disabled={isDownloading}>
                                                {isImage ? (
                                                    <View style={styles.assetImageContainer}>
                                                        <Image
                                                            source={{ uri: asset.downloadUrl }}
                                                            style={styles.assetThumbnail}
                                                            resizeMode="cover"
                                                        />
                                                        <TouchableOpacity
                                                            style={styles.assetDownloadButton}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadAsset(asset);
                                                            }}
                                                            disabled={isDownloading}>
                                                            {isDownloading ? (
                                                                <ActivityIndicator size="small" color={THEME.colors.white} />
                                                            ) : (
                                                                <Icon name="download" size="sm" color={THEME.colors.white} />
                                                            )}
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <View style={styles.assetFileContainer}>
                                                        <Icon
                                                            name="file-document"
                                                            size="xl"
                                                            color={THEME.colors.primary}
                                                        />
                                                        <Body size="sm" numberOfLines={2} style={styles.assetFileName}>
                                                            {asset.filename}
                                                        </Body>
                                                        {isDownloading ? (
                                                            <ActivityIndicator size="small" color={THEME.colors.primary} />
                                                        ) : (
                                                            <Icon name="download" size="sm" color={THEME.colors.textSecondary} />
                                                        )}
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </Card>
                        </View>
                    )}

                    {/* Comments Section */}
                    <View style={styles.section}>
                        <Heading level={3} style={styles.sectionTitle}>
                            Comments ({task.commentCount})
                        </Heading>
                        {topLevelComments.length > 0 ? (
                            <View style={styles.commentsContainer}>
                                {topLevelComments.map((comment) => (
                                    <ThreadedComment
                                        key={comment.id}
                                        comment={comment}
                                        onReply={handleReplyToComment}
                                        projectId={projectId}
                                        taskId={taskId}
                                    />
                                ))}
                            </View>
                        ) : (
                            <Card style={styles.emptyCommentsCard}>
                                <Body style={styles.emptyText}>No comments yet</Body>
                            </Card>
                        )}
                    </View>

                    {/* Status Actions */}
                    <View style={styles.actions}>
                        {task.status === 'OPEN' && (
                            <Button
                                title="Start Progress"
                                onPress={() => handleStatusChange('IN_PROGRESS')}
                                loading={updating}
                                variant="primary"
                                style={styles.actionButton}
                            />
                        )}
                        {(task.status === 'IN_PROGRESS' || task.status === 'WIP') && (
                            <>
                                <Button
                                    title="Mark for Inspection"
                                    onPress={() => handleStatusChange('INSPECTION')}
                                    loading={updating}
                                    variant="secondary"
                                    style={styles.actionButton}
                                />
                                <Button
                                    title="Mark as Done"
                                    onPress={() => handleStatusChange('DONE')}
                                    loading={updating}
                                    variant="primary"
                                    style={styles.actionButton}
                                />
                            </>
                        )}
                        {task.status === 'INSPECTION' && (
                            <Button
                                title="Mark as Done"
                                onPress={() => handleStatusChange('DONE')}
                                loading={updating}
                                variant="primary"
                                style={styles.actionButton}
                            />
                        )}
                        {task.status === 'BLOCKED' && (
                            <Button
                                title="Resume Progress"
                                onPress={() => handleStatusChange('IN_PROGRESS')}
                                loading={updating}
                                variant="primary"
                                style={styles.actionButton}
                            />
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Comment Input (Fixed at bottom) */}
            <View style={styles.commentInputContainer}>
                {replyingToCommentId && (
                    <View style={styles.replyIndicator}>
                        <Caption style={styles.replyText}>Replying to comment...</Caption>
                        <TouchableOpacity onPress={handleCancelReply}>
                            <Icon name="close" size="sm" color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.commentInputRow}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Add a comment..."
                        placeholderTextColor={THEME.colors.textTertiary}
                        value={newCommentText}
                        onChangeText={setNewCommentText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !newCommentText.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={handleAddComment}
                        disabled={!newCommentText.trim() || commenting}>
                        {commenting ? (
                            <ActivityIndicator size="small" color={THEME.colors.white} />
                        ) : (
                            <Icon name="send" size="sm" color={THEME.colors.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>


            {/* Blueprint Viewer Modal */}
            {showBlueprintViewer && blueprint && (
                <BlueprintViewer
                    visible={showBlueprintViewer}
                    blueprintId={blueprint.id}
                    projectId={projectId}
                    highlightMarkerId={task?.markerId}
                    onClose={() => setShowBlueprintViewer(false)}
                />
            )}

            {/* Image Preview Modal */}
            {selectedImage && (
                <Modal
                    visible={!!selectedImage}
                    transparent
                    onRequestClose={() => setSelectedImage(null)}
                    animationType="fade">
                    <TouchableOpacity
                        style={styles.imagePreviewOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedImage(null)}>
                        <TouchableOpacity activeOpacity={1} style={styles.imagePreviewContent}>
                            <View style={styles.imagePreviewHeader}>
                                <Body style={styles.imagePreviewTitle} numberOfLines={1}>
                                    {selectedImage.filename}
                                </Body>
                                <TouchableOpacity onPress={() => setSelectedImage(null)}>
                                    <Icon name="close" size="lg" color={THEME.colors.white} />
                                </TouchableOpacity>
                            </View>
                            <Image
                                source={{ uri: selectedImage.downloadUrl }}
                                style={styles.imagePreviewImage}
                                resizeMode="contain"
                            />
                            <Button
                                title="Download"
                                onPress={() => handleDownloadAsset(selectedImage)}
                                variant="primary"
                                style={styles.imagePreviewDownloadButton}
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}

        </KeyboardAvoidingView>
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: THEME.spacing.l,
        paddingBottom: THEME.spacing.xl,
    },
    header: {
        marginBottom: THEME.spacing.m,
    },
    badges: {
        flexDirection: 'row',
        gap: THEME.spacing.s,
        marginBottom: THEME.spacing.s,
    },
    badge: {
        alignSelf: 'flex-start',
    },
    date: {
        color: THEME.colors.textTertiary,
    },
    title: {
        marginBottom: THEME.spacing.m,
    },
    description: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.l,
        lineHeight: 24,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
        marginBottom: THEME.spacing.l,
    },
    locationText: {
        color: THEME.colors.textSecondary,
    },
    section: {
        marginBottom: THEME.spacing.xl,
    },
    sectionTitle: {
        marginBottom: THEME.spacing.m,
    },
    detailsCard: {
        padding: THEME.spacing.l,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.m,
    },
    label: {
        color: THEME.colors.textSecondary,
        fontWeight: '500',
        flex: 1,
    },
    assigneeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.s,
        flex: 2,
        justifyContent: 'flex-end',
    },
    ccUsers: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: THEME.spacing.s,
        flex: 2,
        justifyContent: 'flex-end',
    },
    ccUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
    },
    commentsContainer: {
        gap: THEME.spacing.m,
    },
    commentItem: {
        backgroundColor: THEME.colors.surface,
        padding: THEME.spacing.m,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: THEME.spacing.s,
    },
    commentUser: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.s,
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        padding: 8,
    },
    commentUserInfo: {
        flex: 1,
    },
    commentDate: {
        color: THEME.colors.textTertiary,
    },
    commentBody: {
        lineHeight: 20,
    },
    attachments: {
        marginTop: THEME.spacing.s,
        gap: THEME.spacing.xs,
    },
    attachmentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
        backgroundColor: THEME.colors.surface,
        paddingHorizontal: THEME.spacing.s,
        paddingVertical: THEME.spacing.xs,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    attachmentName: {
        color: THEME.colors.primary,
    },
    emptyCommentsCard: {
        padding: THEME.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: THEME.colors.textTertiary,
    },
    actions: {
        gap: THEME.spacing.m,
    },
    actionButton: {
        marginBottom: THEME.spacing.s,
    },
    commentInputContainer: {
        flexDirection: 'column',
        padding: THEME.spacing.m,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        backgroundColor: THEME.colors.surface,
    },
    replyIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: THEME.spacing.xs,
        paddingHorizontal: THEME.spacing.s,
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: THEME.radius.base,
        marginBottom: THEME.spacing.s,
    },
    replyText: {
        color: THEME.colors.primary,
        fontStyle: 'italic',
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.s,
    },
    commentInput: {
        flex: 1,
        backgroundColor: THEME.colors.background,
        borderRadius: 8,
        paddingHorizontal: THEME.spacing.m,
        paddingVertical: THEME.spacing.s,
        color: THEME.colors.text,
        maxHeight: 100,
        fontFamily: THEME.typography.fontFamily.regular,
        fontSize: THEME.typography.fontSize.base,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: THEME.colors.border,
    },
    // Blueprint styles
    blueprintCard: {
        backgroundColor: THEME.colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        padding: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
    },
    blueprintHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
    },
    blueprintInfo: {
        flex: 1,
    },
    blueprintTitle: {
        fontWeight: '600',
        marginBottom: 4,
    },
    blueprintFilename: {
        color: THEME.colors.textSecondary,
    },
    blueprintThumbnail: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: THEME.colors.surface,
    },
    assetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: THEME.spacing.m,
    },
    assetCard: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: THEME.colors.surface,
    },
    assetImageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    assetThumbnail: {
        width: '100%',
        height: '100%',
    },
    assetDownloadButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 8,
    },
    assetFileContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.m,
        gap: THEME.spacing.s,
    },
    assetFileName: {
        textAlign: 'center',
        color: THEME.colors.text,
    },
    imagePreviewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreviewContent: {
        width: '90%',
        maxHeight: '80%',
    },
    imagePreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
    },
    imagePreviewTitle: {
        flex: 1,
        color: THEME.colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    imagePreviewImage: {
        width: '100%',
        height: 400,
        marginBottom: THEME.spacing.l,
    },
    imagePreviewDownloadButton: {
        alignSelf: 'center',
    },
});

interface TaskDetailsHeaderRightProps {
    isWatching: boolean;
    watchLoading: boolean;
    onToggleWatch: () => void;
    onDelete: () => void;
    onEdit: () => void;
    canEdit: boolean;
    canDelete: boolean;
}

const TaskDetailsHeaderRight: React.FC<TaskDetailsHeaderRightProps> = ({
    isWatching,
    watchLoading,
    onToggleWatch,
    onDelete,
    onEdit,
    canEdit,
    canDelete,
}) => (
    <View style={styles.headerRight}>
        <TouchableOpacity
            onPress={onToggleWatch}
            style={styles.headerButton}
            disabled={watchLoading}
        >
            <Icon
                name={isWatching ? "eye" : "eye-outline"}
                size="base"
                color={isWatching ? THEME.colors.primary : THEME.colors.textSecondary}
            />
        </TouchableOpacity>
        {canEdit && (
            <TouchableOpacity
                onPress={onEdit}
                style={styles.headerButton}
            >
                <Icon name="pencil" size="base" color={THEME.colors.primary} />
            </TouchableOpacity>
        )}
        {canDelete && (
            <TouchableOpacity
                onPress={onDelete}
                style={styles.headerButton}
            >
                <Icon name="trash-can" size="base" color={THEME.colors.error} />
            </TouchableOpacity>
        )}
    </View>
);
