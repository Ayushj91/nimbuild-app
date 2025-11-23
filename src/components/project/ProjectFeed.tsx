import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Body, Avatar, Icon } from '../../components';
import { THEME } from '../../theme/Theme';
import { useRequest } from '../../hooks/useRequest';
import { groupService } from '../../services/api/groupService';
import { useAuthStore } from '../../store/authStore';
import { GroupMessage } from '../../types/api';
import { format } from 'date-fns';

interface ProjectFeedProps {
    projectId: string;
}

export const ProjectFeed: React.FC<ProjectFeedProps> = ({ projectId }) => {
    const { user } = useAuthStore();
    const [messageText, setMessageText] = useState('');
    const [groupId, setGroupId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // 1. Fetch Groups to find the default one
    const { request: fetchGroups, loading: loadingGroups } = useRequest(groupService.getProjectGroups, {
        onSuccess: (groups) => {
            if (groups && groups.length > 0) {
                // Use the first group (usually default)
                setGroupId(groups[0].id);
            }
        }
    });

    // 2. Fetch Messages
    const { request: fetchMessages, data: messages } = useRequest(groupService.getMessages);

    // 3. Send Message
    const { request: sendMessage, loading: sending } = useRequest(groupService.sendMessage, {
        onSuccess: () => {
            setMessageText('');
            if (groupId) fetchMessages(groupId);
        }
    });

    useEffect(() => {
        fetchGroups(projectId);
    }, [projectId]);

    useEffect(() => {
        if (groupId) {
            fetchMessages(groupId);
            // Poll for new messages every 10 seconds (simple real-time simulation)
            const interval = setInterval(() => fetchMessages(groupId), 10000);
            return () => clearInterval(interval);
        }
    }, [groupId]);

    const handleSend = () => {
        if (groupId && messageText.trim()) {
            sendMessage(groupId, messageText.trim());
        }
    };

    const renderMessage = ({ item }: { item: GroupMessage }) => {
        const isMe = item.sender.id === user?.id;

        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                {!isMe && (
                    <Avatar name={item.sender.name} size="sm" source={item.sender.avatarUrl ? { uri: item.sender.avatarUrl } : undefined} />
                )}
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                    {!isMe && <Body size="sm" style={styles.senderName}>{item.sender.name}</Body>}
                    <Body style={isMe ? styles.messageTextMe : styles.messageTextOther}>{item.content}</Body>
                    <Body size="sm" style={isMe ? styles.timestampMe : styles.timestampOther}>
                        {format(new Date(item.createdAt), 'h:mm a')}
                    </Body>
                </View>
            </View>
        );
    };

    if (loadingGroups) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    if (!groupId) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Icon name="message-alert" size="xl" color={THEME.colors.textSecondary} />
                    <Body style={styles.emptyText}>No discussion group found for this project.</Body>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages || []}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                inverted={false} // Assuming API returns oldest first or we want standard scroll
                // If API returns newest first, we might need inverted or reverse. 
                // Let's stick to standard chat behavior: newest at bottom.
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!messageText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color={THEME.colors.white} />
                    ) : (
                        <Icon name="send" size="sm" color={THEME.colors.white} />
                    )}
                </TouchableOpacity>
            </View>
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
    listContent: {
        padding: THEME.spacing.m,
        flexGrow: 1,
        justifyContent: 'flex-end', // Push content to bottom if few messages
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: THEME.spacing.m,
        alignItems: 'flex-end',
        gap: THEME.spacing.xs,
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: THEME.spacing.m,
        borderRadius: 16,
    },
    messageBubbleMe: {
        backgroundColor: THEME.colors.primary,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: THEME.colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME.colors.primary,
        marginBottom: 2,
    },
    messageTextMe: {
        color: THEME.colors.white,
    },
    messageTextOther: {
        color: THEME.colors.text,
    },
    timestampMe: {
        color: 'rgba(255, 255, 255, 0.7)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    timestampOther: {
        color: THEME.colors.textTertiary,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.surface,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        alignItems: 'center',
        gap: THEME.spacing.m,
    },
    input: {
        flex: 1,
        backgroundColor: THEME.colors.background,
        borderRadius: 20,
        paddingHorizontal: THEME.spacing.m,
        paddingVertical: THEME.spacing.s,
        maxHeight: 100,
        color: THEME.colors.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: THEME.colors.textTertiary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.xl,
    },
    emptyText: {
        marginTop: THEME.spacing.m,
        color: THEME.colors.textSecondary,
        textAlign: 'center',
    },
});
