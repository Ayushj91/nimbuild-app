import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Body, Caption, Avatar, Icon } from '../components';
import { THEME } from '../theme/Theme';
import { Comment } from '../types/api';
import { format } from 'date-fns';
import { commentService } from '../services/api/commentService';
import { downloadFile } from '../services/downloadService';
import { useToast } from '../contexts/ToastContext';

interface ThreadedCommentProps {
    comment: Comment;
    onReply: (commentId: string) => void;
    depth?: number;
    projectId: string;
    taskId: string;
}

export const ThreadedComment: React.FC<ThreadedCommentProps> = ({
    comment,
    onReply,
    depth = 0,
    projectId,
    taskId
}) => {
    const [showReplies, setShowReplies] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const hasReplies = (replies.length > 0) || (comment.replyCount !== undefined && comment.replyCount > 0);
    const replyCount = comment.replyCount || replies.length || 0;
    const toast = useToast();

    // Sync replies from props if they change (e.g. parent refresh)
    React.useEffect(() => {
        if (comment.replies && comment.replies.length > 0) {
            setReplies(comment.replies);
        }
    }, [comment.replies]);

    const fetchReplies = async () => {
        setLoadingReplies(true);
        try {
            const fetchedReplies = await commentService.getCommentReplies(projectId, taskId, comment.id);
            setReplies(fetchedReplies);
        } catch (error) {
            console.error('Failed to fetch replies:', error);
            toast.showToast({ message: 'Failed to load replies', type: 'error' });
        } finally {
            setLoadingReplies(false);
        }
    };

    // Auto-fetch replies if count increases while expanded
    React.useEffect(() => {
        if (showReplies && replyCount > replies.length && !loadingReplies) {
            fetchReplies();
        }
    }, [replyCount, showReplies, replies.length]);

    const handleToggleReplies = async () => {
        const newShowReplies = !showReplies;
        setShowReplies(newShowReplies);

        if (newShowReplies && replies.length < replyCount) {
            fetchReplies();
        }
    };

    const handleDownload = async (attachment: any) => {
        if (downloading) return;

        setDownloading(attachment.s3Key);
        try {
            const { downloadUrl } = await commentService.getAttachmentDownloadUrl(
                projectId,
                taskId,
                comment.id,
                attachment.s3Key
            );

            const result = await downloadFile(downloadUrl, attachment.filename);

            if (result.success) {
                toast.showToast({ message: `Downloaded: ${attachment.filename}`, type: 'success' });
            } else {
                toast.showToast({ message: result.error || 'Download failed', type: 'error' });
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.showToast({ message: 'Failed to download attachment', type: 'error' });
        } finally {
            setDownloading(null);
        }
    };

    return (
        <View style={[styles.container, depth > 0 && styles.nestedContainer]}>
            {/* Main Comment */}
            <View style={styles.commentContent}>
                <Avatar
                    name={comment.createdByName || 'Unknown'}
                    source={comment.createdByAvatarUrl ? { uri: comment.createdByAvatarUrl } : undefined}
                    size="sm"
                />

                <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                        <Body style={styles.authorName}>{comment.createdByName || 'Unknown'}</Body>
                        <Caption style={styles.timestamp}>
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </Caption>
                    </View>

                    <Body size="sm" style={styles.commentText}>{comment.body}</Body>

                    {/* Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                        <View style={styles.attachmentsContainer}>
                            {comment.attachments.map((attachment, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.attachmentItem}
                                    onPress={() => handleDownload(attachment)}
                                    disabled={!!downloading}
                                >
                                    <View style={styles.attachmentIcon}>
                                        <Icon
                                            name={attachment.type === 'image' ? 'image' : 'file-document'}
                                            size="sm"
                                            color={THEME.colors.primary}
                                        />
                                    </View>
                                    <View style={styles.attachmentInfo}>
                                        <Caption style={styles.attachmentName} numberOfLines={1}>
                                            {attachment.filename}
                                        </Caption>
                                        <Caption style={styles.attachmentSize}>
                                            {(attachment.size / 1024).toFixed(1)} KB
                                        </Caption>
                                    </View>
                                    {downloading === attachment.s3Key ? (
                                        <ActivityIndicator size="small" color={THEME.colors.primary} />
                                    ) : (
                                        <Icon name="download" size="sm" color={THEME.colors.textSecondary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Reply to indicator */}
                    {comment.replyToComment && (
                        <View style={styles.replyToContainer}>
                            <Icon name="subdirectory-arrow-right" size="sm" color={THEME.colors.textSecondary} />
                            <Caption style={styles.replyToText}>
                                Replying to {comment.replyToComment.createdByName || 'Unknown'}
                            </Caption>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actions}>
                        {depth === 0 && (
                            <TouchableOpacity onPress={() => onReply(comment.id)}>
                                <Caption style={styles.actionText}>Reply</Caption>
                            </TouchableOpacity>
                        )}

                        {hasReplies && (
                            <TouchableOpacity
                                onPress={handleToggleReplies}
                                style={styles.showRepliesButton}
                            >
                                <Icon
                                    name={showReplies ? 'chevron-up' : 'chevron-down'}
                                    size="sm"
                                    color={THEME.colors.primary}
                                />
                                <Caption style={styles.showRepliesText}>
                                    {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                </Caption>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Nested Replies */}
            {showReplies && (
                <View style={styles.repliesContainer}>
                    {loadingReplies ? (
                        <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginTop: 8 }} />
                    ) : (
                        replies.map((reply) => (
                            <ThreadedComment
                                key={reply.id}
                                comment={reply}
                                onReply={onReply}
                                depth={depth + 1}
                                projectId={projectId}
                                taskId={taskId}
                            />
                        ))
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: THEME.spacing.m,
    },
    nestedContainer: {
        marginLeft: THEME.spacing.xl,
        marginTop: THEME.spacing.m,
        borderLeftWidth: 2,
        borderLeftColor: THEME.colors.border,
        paddingLeft: THEME.spacing.m,
    },
    commentContent: {
        flexDirection: 'row',
        gap: THEME.spacing.m,
    },
    commentBody: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.xs,
        gap: THEME.spacing.s,
    },
    authorName: {
        fontWeight: '600',
    },
    timestamp: {
        color: THEME.colors.textSecondary,
    },
    commentText: {
        marginBottom: THEME.spacing.s,
        lineHeight: 20,
    },
    replyToContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
        marginBottom: THEME.spacing.s,
        paddingLeft: THEME.spacing.s,
        borderLeftWidth: 2,
        borderLeftColor: THEME.colors.primary,
    },
    replyToText: {
        color: THEME.colors.textSecondary,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: THEME.spacing.l,
        marginTop: THEME.spacing.xs,
    },
    actionText: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    showRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
    },
    showRepliesText: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    repliesContainer: {
        marginTop: THEME.spacing.m,
    },
    attachmentsContainer: {
        marginTop: THEME.spacing.s,
        gap: THEME.spacing.xs,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surfaceVariant,
        padding: THEME.spacing.s,
        borderRadius: THEME.radius.sm,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    attachmentIcon: {
        marginRight: THEME.spacing.s,
    },
    attachmentInfo: {
        flex: 1,
        marginRight: THEME.spacing.s,
    },
    attachmentName: {
        fontWeight: '500',
        color: THEME.colors.text,
    },
    attachmentSize: {
        fontSize: 10,
        color: THEME.colors.textSecondary,
    },
});
