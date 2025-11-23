import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { Body, Caption, Avatar, Icon } from '../../components';
import { THEME } from '../../theme/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { groupService } from '../../services/api/groupService';
import { useAuthStore } from '../../store/authStore';
import { GroupMessage } from '../../types/api';
import { format } from 'date-fns';
import { launchImageLibrary } from 'react-native-image-picker';

type GroupChatScreenProps = NativeStackScreenProps<MainStackParamList, 'GroupChat'>;

export const GroupChatScreen: React.FC<GroupChatScreenProps> = ({ route }) => {
    const { groupId } = route.params;
    const { user } = useAuthStore();
    const [messageText, setMessageText] = useState('');
    const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    const { request: fetchMessages, data: messages } = useRequest(groupService.getMessages);

    const { request: sendMessage, loading: sending } = useRequest(groupService.sendMessage, {
        onSuccess: () => {
            setMessageText('');
            setReplyTo(null);
            setSelectedFile(null);
            fetchMessages(groupId);
        }
    });

    const { request: sendMessageWithFile, loading: sendingFile } = useRequest(groupService.sendMessageWithAsset, {
        onSuccess: () => {
            setMessageText('');
            setReplyTo(null);
            setSelectedFile(null);
            fetchMessages(groupId);
        }
    });

    useEffect(() => {
        fetchMessages(groupId);
        const interval = setInterval(() => fetchMessages(groupId), 10000);
        return () => clearInterval(interval);
    }, [groupId]);

    const handleSend = () => {
        if (!messageText.trim() && !selectedFile) return;

        if (selectedFile) {
            sendMessageWithFile(groupId, messageText.trim() || 'Shared a file', selectedFile, replyTo?.id);
        } else {
            sendMessage(groupId, messageText.trim(), replyTo?.id);
        }
    };

    const handlePickFile = () => {
        launchImageLibrary(
            {
                mediaType: 'mixed',
                selectionLimit: 1,
            },
            (response) => {
                if (response.didCancel) return;
                if (response.errorCode) {
                    Alert.alert('Error', response.errorMessage || 'Failed to pick file');
                    return;
                }
                if (response.assets && response.assets[0]) {
                    setSelectedFile(response.assets[0]);
                }
            }
        );
    };

    const renderMessage = ({ item }: { item: GroupMessage }) => {
        const isMe = item.sender.id === user?.id;

        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                {!isMe && (
                    <Avatar
                        name={item.sender.name}
                        size="sm"
                        source={item.sender.avatarUrl ? { uri: item.sender.avatarUrl } : undefined}
                    />
                )}
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                    {!isMe && <Caption style={styles.senderName}>{item.sender.name}</Caption>}

                    {/* Reply Context */}
                    {item.replyToMessage && (
                        <View style={styles.replyContext}>
                            <Caption style={styles.replyLabel}>
                                Replying to {item.replyToMessage.sender.name}
                            </Caption>
                            <Caption style={styles.replyContent} numberOfLines={1}>
                                {item.replyToMessage.content}
                            </Caption>
                        </View>
                    )}

                    {/* Message Content */}
                    <Body style={isMe ? styles.messageTextMe : styles.messageTextOther}>
                        {item.content}
                    </Body>

                    {/* Attachments */}
                    {item.attachments && item.attachments.length > 0 && (
                        <View style={styles.attachmentsContainer}>
                            {item.attachments.map((att, idx) => (
                                <TouchableOpacity key={idx} style={styles.attachment}>
                                    {att.type === 'image' ? (
                                        <Image source={{ uri: att.downloadUrl }} style={styles.attachmentImage} />
                                    ) : (
                                        <View style={styles.fileAttachment}>
                                            <Icon name="file-document" size="base" color={THEME.colors.primary} />
                                            <Caption style={styles.fileName}>{att.filename}</Caption>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Timestamp and Reactions */}
                    <View style={styles.messageFooter}>
                        <Caption style={isMe ? styles.timestampMe : styles.timestampOther}>
                            {format(new Date(item.createdAt), 'h:mm a')}
                        </Caption>
                        {item.reactions && item.reactions.length > 0 && (
                            <View style={styles.reactionsContainer}>
                                {item.reactions.map((reaction, idx) => (
                                    <Caption key={idx} style={styles.reaction}>
                                        {reaction.emoji}
                                    </Caption>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    {!isMe && (
                        <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() => setReplyTo(item)}
                        >
                            <Icon name="reply" size="sm" color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

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
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Reply Banner */}
            {replyTo && (
                <View style={styles.replyBanner}>
                    <View style={styles.replyBannerContent}>
                        <Caption style={styles.replyBannerLabel}>
                            Replying to {replyTo.sender.name}
                        </Caption>
                        <Caption numberOfLines={1}>{replyTo.content}</Caption>
                    </View>
                    <TouchableOpacity onPress={() => setReplyTo(null)}>
                        <Icon name="close" size="base" color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* File Preview */}
            {selectedFile && (
                <View style={styles.filePreview}>
                    <Caption>📎 {selectedFile.fileName || selectedFile.name}</Caption>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                        <Icon name="close-circle" size="base" color={THEME.colors.error} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={handlePickFile} style={styles.attachButton}>
                    <Icon name="paperclip" size="base" color={THEME.colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!messageText.trim() && !selectedFile) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={(!messageText.trim() && !selectedFile) || sending || sendingFile}
                >
                    {(sending || sendingFile) ? (
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
    listContent: {
        padding: THEME.spacing.m,
        flexGrow: 1,
        justifyContent: 'flex-end',
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
        maxWidth: '75%',
        padding: THEME.spacing.m,
        borderRadius: 16,
        position: 'relative',
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
    replyContext: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: THEME.spacing.xs,
        borderRadius: 4,
        marginBottom: THEME.spacing.xs,
    },
    replyLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: THEME.colors.textSecondary,
    },
    replyContent: {
        fontSize: 11,
        color: THEME.colors.textSecondary,
    },
    messageTextMe: {
        color: THEME.colors.white,
    },
    messageTextOther: {
        color: THEME.colors.text,
    },
    attachmentsContainer: {
        marginTop: THEME.spacing.xs,
    },
    attachment: {
        marginTop: THEME.spacing.xs,
    },
    attachmentImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
    },
    fileAttachment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
        padding: THEME.spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
    },
    fileName: {
        fontSize: 12,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    timestampMe: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    timestampOther: {
        fontSize: 10,
        color: THEME.colors.textTertiary,
    },
    reactionsContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    reaction: {
        fontSize: 14,
    },
    replyButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: THEME.colors.surface,
        borderRadius: 12,
        padding: 4,
        elevation: 2,
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: THEME.colors.primaryLight,
        padding: THEME.spacing.s,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
    },
    replyBannerContent: {
        flex: 1,
    },
    replyBannerLabel: {
        fontWeight: '600',
        color: THEME.colors.primary,
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: THEME.colors.warningLight,
        padding: THEME.spacing.s,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
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
    attachButton: {
        padding: THEME.spacing.xs,
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
});
