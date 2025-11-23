import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    ActivityIndicator,
    FlatList,

    Platform,
    Dimensions,
} from 'react-native';
import { Heading, Body, Button, Icon, Avatar } from '../../components';
import { THEME } from '../../theme/Theme';
import { EditTaskScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { taskService } from '../../services/api/taskService';
import { userService } from '../../services/api/userService';
import { blueprintService } from '../../services/api/blueprintService';
import { TaskCategory, TaskStatus, User, Blueprint } from '../../types/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { BlueprintSelector, BlueprintEditor } from '../../components/blueprint';
import { useProjectPermission } from '../../hooks/usePermission';
import { Permission } from '../../types/permissions';

const CATEGORIES: { label: string; value: TaskCategory }[] = [
    { label: 'Snag', value: 'SNAG' },
    { label: 'Quality Issue', value: 'QUALITY_ISSUE' },
    { label: 'EHS Issue', value: 'EHS_ISSUE' },
    { label: 'Other', value: 'OTHER' },
];

const STATUSES: { label: string; value: TaskStatus }[] = [
    { label: 'Open', value: 'OPEN' },
    { label: 'WIP', value: 'WIP' },
    { label: 'Inspection', value: 'INSPECTION' },
    { label: 'Closed', value: 'CLOSED' },
];

interface MediaAttachment {
    uri: string;
    type: string;
    name: string;
}

export const EditTaskScreen: React.FC<EditTaskScreenProps> = ({
    route,
    navigation,
}) => {
    const { projectId, taskId, task: initialTask } = route.params;
    const { can, isLoading: permissionLoading } = useProjectPermission(projectId);

    useEffect(() => {
        if (!permissionLoading && !can(Permission.UPDATE_TASK)) {
            Alert.alert('Access Denied', 'You do not have permission to edit this task.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    }, [permissionLoading, can, navigation]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('SNAG');
    const [location, setLocation] = useState('');
    const [locationType, setLocationType] = useState<'text' | 'blueprint'>('text');
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
    const [blueprintMarker, setBlueprintMarker] = useState<{ x: number; y: number; label?: string } | null>(null);
    const [showBlueprintSelector, setShowBlueprintSelector] = useState(false);
    const [showBlueprintEditor, setShowBlueprintEditor] = useState(false);
    const [status, setStatus] = useState<TaskStatus>('OPEN');
    const [assignedTo, setAssignedTo] = useState<User | null>(null);
    const [ccUsers, setCcUsers] = useState<User[]>([]);
    const [duration, setDuration] = useState('');
    const [unit, setUnit] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [finishDate, setFinishDate] = useState<Date | undefined>();
    const [quantity, setQuantity] = useState('');
    const [priority, setPriority] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState<
        'start' | 'finish' | 'due' | null
    >(null);
    const [newAttachments, setNewAttachments] = useState<MediaAttachment[]>([]);
    const [existingAssets, setExistingAssets] = useState<any[]>([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userModalMode, setUserModalMode] = useState<'assignee' | 'cc'>('assignee');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const { request: updateTask, loading } = useRequest(taskService.updateTask, {
        onSuccess: () => {
            navigation.goBack();
        },
        successMessage: 'Task updated successfully',
    });

    const { request: searchUsers } = useRequest(userService.searchUsers, {
        showErrorToast: true,
    });

    const { request: fetchBlueprint } = useRequest(blueprintService.getBlueprint, {
        onSuccess: (data) => setSelectedBlueprint(data),
    });

    // Pre-fill data
    useEffect(() => {
        if (initialTask) {
            setTitle(initialTask.title);
            setDescription(initialTask.description || '');
            setCategory(initialTask.category || 'SNAG');
            setStatus(initialTask.status);

            if (initialTask.blueprintId) {
                setLocationType('blueprint');
                // Assuming metadata stores marker info, but if not, we might miss it. 
                // For now, we'll assume location string might hold JSON or we just set blueprint.
                // If marker data isn't readily available in Task object, we might skip pre-filling marker exact position unless it's in metadata.
                if (initialTask.metadata) {
                    try {
                        const meta = JSON.parse(initialTask.metadata);
                        if (meta.marker) setBlueprintMarker(meta.marker);
                    } catch { }
                }
            } else {
                setLocationType('text');
                setLocation(initialTask.location || '');
            }

            setAssignedTo(initialTask.assignedTo || null);
            setCcUsers(initialTask.ccUsers || []);
            setDuration(initialTask.duration ? initialTask.duration.toString() : '');
            setUnit(initialTask.unit || '');
            setStartDate(initialTask.startDate ? new Date(initialTask.startDate) : undefined);
            setFinishDate(initialTask.finishDate ? new Date(initialTask.finishDate) : undefined);
            setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate) : undefined);
            setQuantity(initialTask.quantity ? initialTask.quantity.toString() : '');
            setPriority(initialTask.priority ? initialTask.priority.toString() : '');
            setExistingAssets(initialTask.assets || []);
        }
    }, [initialTask]);

    useEffect(() => {
        if (initialTask?.blueprintId) {
            fetchBlueprint(projectId, initialTask.blueprintId);
        }
    }, [initialTask?.blueprintId, projectId]);

    const handleSearchUsers = useCallback(async (query: string) => {
        setSearchLoading(true);
        try {
            const results = await searchUsers(query);
            if (results) setSearchResults(results);
        } catch (error) {
            console.error('Search users error:', error);
        } finally {
            setSearchLoading(false);
        }
    }, [searchUsers]);

    // Search users when query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearchUsers(searchQuery.trim());
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCamera = async () => {
        launchCamera(
            { mediaType: 'photo', quality: 0.8, saveToPhotos: true },
            (response) => {
                if (response.assets && response.assets[0]) {
                    const asset = response.assets[0];
                    setNewAttachments([
                        ...newAttachments,
                        {
                            uri: asset.uri || '',
                            type: asset.type || 'image/jpeg',
                            name: asset.fileName || 'photo.jpg',
                        },
                    ]);
                }
            }
        );
    };

    const handleGallery = () => {
        launchImageLibrary(
            { mediaType: 'photo', quality: 0.8, selectionLimit: 5 },
            (response) => {
                if (response.assets) {
                    const newAssets = response.assets.map((asset) => ({
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `image_${Date.now()}.jpg`,
                    }));
                    setNewAttachments([...newAttachments, ...newAssets]);
                }
            }
        );
    };

    const handleDocument = async () => {
        try {
            const results = await pick({
                type: [types.allFiles],
                allowMultiSelection: true,
                presentationStyle: 'fullScreen',
            });
            const newAssets = results.map((file) => ({
                uri: file.uri,
                type: file.type || 'application/octet-stream',
                name: file.name || `file_${Date.now()}`,
            }));
            setNewAttachments((prev) => [...prev, ...newAssets]);
        } catch (err: any) {
            if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
                Alert.alert('Error', 'Failed to select files');
            }
        }
    };

    const handleRemoveNewAttachment = (index: number) => {
        setNewAttachments(newAttachments.filter((_, i) => i !== index));
    };

    const handleOpenUserModal = (mode: 'assignee' | 'cc') => {
        setUserModalMode(mode);
        setSearchQuery('');
        setSearchResults([]);
        setShowUserModal(true);
    };

    const handleSelectUser = (user: User) => {
        if (userModalMode === 'assignee') {
            setAssignedTo(user);
            setShowUserModal(false);
        } else {
            const exists = ccUsers.find((u) => u.id === user.id);
            if (exists) {
                setCcUsers(ccUsers.filter((u) => u.id !== user.id));
            } else {
                setCcUsers([...ccUsers, user]);
            }
        }
    };

    const handleRemoveCcUser = (userId: string) => {
        setCcUsers(ccUsers.filter((u) => u.id !== userId));
    };

    const handleBlueprintSelect = (blueprint: Blueprint) => {
        setSelectedBlueprint(blueprint);
        setShowBlueprintSelector(false);
        setShowBlueprintEditor(true);
    };



    const handleToggleLocationType = () => {
        const newType = locationType === 'text' ? 'blueprint' : 'text';
        setLocationType(newType);
        if (newType === 'blueprint') {
            setLocation('');
        } else {
            setSelectedBlueprint(null);
            setBlueprintMarker(null);
        }
    };

    const handleRemoveBlueprint = () => {
        setSelectedBlueprint(null);
        setBlueprintMarker(null);
    };

    const handleUpdate = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        updateTask(projectId, taskId, {
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            location: locationType === 'text' ? location.trim() || undefined : undefined,
            blueprintId: locationType === 'blueprint' ? selectedBlueprint?.id : undefined,
            status,
            assignedToId: assignedTo?.id,
            ccUserIds: ccUsers.map((u) => u.id),
            duration: duration ? parseInt(duration, 10) : undefined,
            unit: unit.trim() || undefined,
            startDate: startDate?.toISOString(),
            finishDate: finishDate?.toISOString(),
            quantity: quantity ? parseFloat(quantity) : undefined,
            priority: priority ? parseInt(priority, 10) : undefined,
            dueDate: dueDate?.toISOString(),
            metadata: blueprintMarker ? JSON.stringify({ marker: blueprintMarker }) : undefined,
        }, newAttachments.length > 0 ? newAttachments : undefined);
    };

    const handleDateChange = (
        type: 'start' | 'finish' | 'due',
        event: any,
        selectedDate?: Date
    ) => {
        setShowDatePicker(null);
        if (selectedDate) {
            if (type === 'start') setStartDate(selectedDate);
            else if (type === 'finish') setFinishDate(selectedDate);
            else setDueDate(selectedDate);
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderCategoryButton = (item: { label: string; value: TaskCategory }) => (
        <TouchableOpacity
            key={item.value}
            style={[
                styles.pillButton,
                category === item.value && styles.pillButtonSelected,
            ]}
            onPress={() => setCategory(item.value)}>
            <Body
                size="sm"
                style={[
                    styles.pillButtonText,
                    category === item.value && styles.pillButtonTextSelected,
                ]}>
                {item.label}
            </Body>
        </TouchableOpacity>
    );

    const renderStatusButton = (item: { label: string; value: TaskStatus }) => (
        <TouchableOpacity
            key={item.value}
            style={[
                styles.pillButton,
                status === item.value && styles.pillButtonSelected,
            ]}
            onPress={() => setStatus(item.value)}>
            <Body
                size="sm"
                style={[
                    styles.pillButtonText,
                    status === item.value && styles.pillButtonTextSelected,
                ]}>
                {item.label}
            </Body>
        </TouchableOpacity>
    );

    const isImage = (type: string) => type.startsWith('image/');

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Media Attachment Buttons */}
                    <View style={styles.mediaButtons}>
                        <TouchableOpacity style={styles.mediaButton} onPress={handleCamera}>
                            <Icon name="camera" size="lg" color={THEME.colors.textSecondary} />
                            <View style={styles.addBadge}>
                                <Icon name="plus" size="sm" color={THEME.colors.white} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton} onPress={handleGallery}>
                            <Icon name="image" size="lg" color={THEME.colors.textSecondary} />
                            <View style={styles.addBadge}>
                                <Icon name="plus" size="sm" color={THEME.colors.white} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton} onPress={handleDocument}>
                            <Icon name="paperclip" size="lg" color={THEME.colors.textSecondary} />
                            <View style={styles.addBadge}>
                                <Icon name="plus" size="sm" color={THEME.colors.white} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Existing Assets (Read-only for now) */}
                    {existingAssets.length > 0 && (
                        <View style={styles.attachmentsPreview}>
                            <Body size="sm" style={styles.label}>Existing Assets</Body>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {existingAssets.map((asset, index) => (
                                    <View key={`existing-${index}`} style={styles.attachmentItem}>
                                        {asset.contentType?.startsWith('image/') ? (
                                            <Image
                                                source={{ uri: asset.downloadUrl }}
                                                style={styles.attachmentImage}
                                            />
                                        ) : (
                                            <View style={styles.attachmentFile}>
                                                <Icon name="file-document" size="lg" color={THEME.colors.textSecondary} />
                                                <Body size="sm" numberOfLines={1} style={styles.fileName}>
                                                    {asset.filename}
                                                </Body>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* New Attachments Preview */}
                    {newAttachments.length > 0 && (
                        <View style={styles.attachmentsPreview}>
                            <Body size="sm" style={styles.label}>New Attachments</Body>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {newAttachments.map((attachment, index) => (
                                    <View key={`new-${index}`} style={styles.attachmentItem}>
                                        {isImage(attachment.type) ? (
                                            <Image
                                                source={{ uri: attachment.uri }}
                                                style={styles.attachmentImage}
                                            />
                                        ) : (
                                            <View style={styles.attachmentFile}>
                                                <Icon name="file-document" size="lg" color={THEME.colors.textSecondary} />
                                                <Body size="sm" numberOfLines={1} style={styles.fileName}>
                                                    {attachment.name}
                                                </Body>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveNewAttachment(index)}>
                                            <Icon name="close-circle" size="sm" color={THEME.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Title Field */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>Title<Body style={styles.required}>*</Body></Body>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter task title"
                            placeholderTextColor={THEME.colors.textTertiary}
                        />
                    </View>

                    {/* Category */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>Category<Body style={styles.required}>*</Body></Body>
                        <View style={styles.pillRow}>
                            {CATEGORIES.map(renderCategoryButton)}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>Description<Body style={styles.required}>*</Body></Body>
                        <View style={styles.inputWithIcon}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe the task..."
                                placeholderTextColor={THEME.colors.textTertiary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.fieldGroup}>
                        <View style={styles.locationHeader}>
                            <Body style={styles.label}>Location</Body>
                            <TouchableOpacity style={styles.locationToggle} onPress={handleToggleLocationType}>
                                <Icon name={locationType === 'text' ? 'text' : 'image'} size="sm" color={THEME.colors.primary} />
                                <Body size="sm" style={styles.toggleText}>{locationType === 'text' ? 'Use Blueprint' : 'Use Text'}</Body>
                            </TouchableOpacity>
                        </View>
                        {locationType === 'text' ? (
                            <View style={styles.inputWithIcon}>
                                <TextInput
                                    style={styles.input}
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholder="Enter location"
                                    placeholderTextColor={THEME.colors.textTertiary}
                                />
                                <TouchableOpacity style={styles.inputIcon}>
                                    <Icon name="map-marker" size="sm" color={THEME.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {selectedBlueprint && blueprintMarker ? (
                                    <View style={styles.blueprintPreviewCard}>
                                        <View style={styles.blueprintPreviewHeader}>
                                            <Icon name="image" size="lg" color={THEME.colors.primary} />
                                            <View style={styles.blueprintPreviewInfo}>
                                                <Body style={styles.blueprintName} numberOfLines={1}>{selectedBlueprint.filename}</Body>
                                                <Body size="sm" style={styles.blueprintMeta}>Marker at {(blueprintMarker.x * 100).toFixed(0)}%, {(blueprintMarker.y * 100).toFixed(0)}%</Body>
                                            </View>
                                            <TouchableOpacity onPress={handleRemoveBlueprint}>
                                                <Icon name="close" size="lg" color={THEME.colors.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.blueprintPickerButton} onPress={() => setShowBlueprintSelector(true)}>
                                        <Icon name="file-document-outline" size="lg" color={THEME.colors.primary} />
                                        <Body style={styles.blueprintPickerText}>Select Blueprint & Place Marker</Body>
                                        <Icon name="chevron-right" size="sm" color={THEME.colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>

                    {/* Assigned To */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>To</Body>
                        {assignedTo ? (
                            <View style={styles.userChip}>
                                <Avatar name={assignedTo.name} size="sm" />
                                <Body style={styles.userChipText}>{assignedTo.name}</Body>
                                <TouchableOpacity onPress={() => setAssignedTo(null)}>
                                    <Icon name="close" size="sm" color={THEME.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.input} onPress={() => handleOpenUserModal('assignee')}>
                                <Body style={styles.placeholder}>Select assignee</Body>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* CC */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>CC</Body>
                        {ccUsers.length > 0 && (
                            <View style={styles.ccUsersContainer}>
                                {ccUsers.map((user) => (
                                    <View key={user.id} style={styles.userChip}>
                                        <Avatar name={user.name} size="sm" />
                                        <Body style={styles.userChipText}>{user.name}</Body>
                                        <TouchableOpacity onPress={() => handleRemoveCcUser(user.id)}>
                                            <Icon name="close" size="sm" color={THEME.colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity style={styles.input} onPress={() => handleOpenUserModal('cc')}>
                            <Body style={styles.placeholder}>{ccUsers.length > 0 ? 'Add more CC users' : 'Add CC users'}</Body>
                        </TouchableOpacity>
                    </View>

                    {/* Duration */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>Duration</Body>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="Enter duration"
                            placeholderTextColor={THEME.colors.textTertiary}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Dates */}
                    <View style={styles.rowFields}>
                        <View style={[styles.fieldGroup, styles.halfField]}>
                            <Body style={styles.label}>Start Date</Body>
                            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker('start')}>
                                <Body style={startDate ? styles.inputText : styles.placeholder}>{formatDate(startDate) || 'Select date'}</Body>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.fieldGroup, styles.halfField]}>
                            <Body style={styles.label}>Finish Date</Body>
                            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker('finish')}>
                                <Body style={finishDate ? styles.inputText : styles.placeholder}>{formatDate(finishDate) || 'Select date'}</Body>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Quantity & Unit */}
                    <View style={styles.rowFields}>
                        <View style={[styles.fieldGroup, styles.halfField]}>
                            <Body style={styles.label}>Quantity</Body>
                            <TextInput
                                style={styles.input}
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder="Enter quantity"
                                placeholderTextColor={THEME.colors.textTertiary}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.fieldGroup, styles.halfField]}>
                            <Body style={styles.label}>Unit</Body>
                            <TextInput
                                style={styles.input}
                                value={unit}
                                onChangeText={setUnit}
                                placeholder="e.g., pieces, kg"
                                placeholderTextColor={THEME.colors.textTertiary}
                            />
                        </View>
                    </View>

                    {/* Status */}
                    <View style={styles.fieldGroup}>
                        <Body style={styles.label}>Status</Body>
                        <View style={styles.pillRow}>
                            {STATUSES.map(renderStatusButton)}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <Button
                        title="Update Task"
                        onPress={handleUpdate}
                        loading={loading}
                        variant="primary"
                        style={styles.submitButton}
                    />
                </View>
            </ScrollView>

            {/* Date Pickers */}
            {showDatePicker && (
                <DateTimePicker
                    value={
                        showDatePicker === 'start'
                            ? startDate || new Date()
                            : showDatePicker === 'finish'
                                ? finishDate || new Date()
                                : dueDate || new Date()
                    }
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => handleDateChange(showDatePicker, e, date)}
                />
            )}

            {/* Blueprint Selector */}
            {showBlueprintSelector && (
                <BlueprintSelector
                    visible={showBlueprintSelector}
                    projectId={projectId}
                    onSelect={handleBlueprintSelect}
                    onClose={() => setShowBlueprintSelector(false)}
                />
            )}

            {/* Blueprint Editor */}
            {showBlueprintEditor && selectedBlueprint && (
                <BlueprintEditor
                    blueprint={selectedBlueprint}
                    projectId={projectId}
                    onSave={(marker) => {
                        setBlueprintMarker(marker);
                        setShowBlueprintEditor(false);
                        setSelectedBlueprint(null);
                    }}
                    onCancel={() => {
                        setShowBlueprintEditor(false);
                        setSelectedBlueprint(null);
                    }}
                />
            )}

            {/* User Search Modal */}
            <Modal
                visible={showUserModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowUserModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Heading level={3}>{userModalMode === 'assignee' ? 'Select Assignee' : 'Select CC Users'}</Heading>
                            <TouchableOpacity onPress={() => setShowUserModal(false)}>
                                <Icon name="close" size="lg" color={THEME.colors.text} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name, email, or phone..."
                            placeholderTextColor={THEME.colors.textTertiary}
                            autoFocus
                        />
                        {userModalMode === 'cc' && ccUsers.length > 0 && (
                            <View style={styles.selectedSection}>
                                <Body size="sm" style={styles.selectedLabel}>Selected ({ccUsers.length})</Body>
                            </View>
                        )}
                        {searchLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={THEME.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.userItem, userModalMode === 'cc' && ccUsers.find(u => u.id === item.id) && styles.userItemSelected]}
                                        onPress={() => handleSelectUser(item)}>
                                        <Avatar name={item.name} size="sm" />
                                        <View style={styles.userItemInfo}>
                                            <Body>{item.name || 'No Name'}</Body>
                                            <Body size="sm" style={styles.userItemDetail}>{item.phone || item.email}</Body>
                                        </View>
                                        {userModalMode === 'cc' && ccUsers.find(u => u.id === item.id) && (
                                            <Icon name="check-circle" size="sm" color={THEME.colors.success} />
                                        )}
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    searchQuery.length >= 2 ? (
                                        <View style={styles.emptyState}><Body>No users found</Body></View>
                                    ) : null
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    scrollView: { flex: 1 },
    content: { padding: THEME.spacing.l },
    mediaButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: THEME.spacing.l },
    mediaButton: {
        width: (Dimensions.get('window').width - THEME.spacing.l * 2 - THEME.spacing.m * 3) / 4,
        aspectRatio: 1,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.base,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderStyle: 'dashed',
    },
    addBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: THEME.colors.primary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: THEME.colors.background,
    },
    attachmentsPreview: { marginBottom: THEME.spacing.l },
    attachmentItem: { marginRight: THEME.spacing.m, width: 80, height: 80, borderRadius: THEME.radius.xl, overflow: 'hidden', backgroundColor: THEME.colors.surface, borderWidth: 1, borderColor: THEME.colors.border },
    attachmentImage: { width: '100%', height: '100%' },
    attachmentFile: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: THEME.spacing.xs },
    fileName: { marginTop: THEME.spacing.xs, textAlign: 'center', fontSize: 10 },
    removeButton: { position: 'absolute', top: 2, right: 2, backgroundColor: THEME.colors.white, borderRadius: 10 },
    fieldGroup: { marginBottom: THEME.spacing.l },
    label: { marginBottom: THEME.spacing.xs, color: THEME.colors.textSecondary, fontWeight: '600' },
    required: { color: THEME.colors.error },
    input: {
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderRadius: THEME.radius.base,
        padding: THEME.spacing.m,
        color: THEME.colors.text,
        fontSize: 16,
    },
    textArea: { height: 100 },
    inputWithIcon: { position: 'relative' },
    inputIcon: { position: 'absolute', right: THEME.spacing.m, top: THEME.spacing.m },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: THEME.spacing.s },
    pillButton: {
        paddingHorizontal: THEME.spacing.m,
        paddingVertical: THEME.spacing.s,
        borderRadius: THEME.radius.lg,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        backgroundColor: THEME.colors.surface,
    },
    pillButtonSelected: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    pillButtonText: { color: THEME.colors.textSecondary },
    pillButtonTextSelected: { color: THEME.colors.white, fontWeight: '600' },
    locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xs },
    locationToggle: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.xs },
    toggleText: { color: THEME.colors.primary, fontWeight: '600' },
    blueprintPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
        borderStyle: 'dashed',
        borderRadius: THEME.radius.base,
        padding: THEME.spacing.m,
        gap: THEME.spacing.m,
    },
    blueprintPickerText: { flex: 1, color: THEME.colors.primary, fontWeight: '500' },
    blueprintPreviewCard: {
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderRadius: THEME.radius.base,
        padding: THEME.spacing.m,
    },
    blueprintPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.m },
    blueprintPreviewInfo: { flex: 1 },
    blueprintName: { fontWeight: '600' },
    blueprintMeta: { color: THEME.colors.textSecondary },
    userChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderRadius: THEME.radius.lg,
        padding: THEME.spacing.s,
        paddingRight: THEME.spacing.m,
        gap: THEME.spacing.s,
        alignSelf: 'flex-start',
        marginBottom: THEME.spacing.s,
    },
    userChipText: { fontWeight: '500' },
    ccUsersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: THEME.spacing.s, marginBottom: THEME.spacing.s },
    placeholder: { color: THEME.colors.textTertiary },
    inputText: { color: THEME.colors.text },
    rowFields: { flexDirection: 'row', gap: THEME.spacing.m },
    halfField: { flex: 1 },
    submitButton: { marginTop: THEME.spacing.l, marginBottom: THEME.spacing.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: THEME.colors.background, borderTopLeftRadius: THEME.radius.xl, borderTopRightRadius: THEME.radius.xl, padding: THEME.spacing.l, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.l },
    searchInput: { backgroundColor: THEME.colors.surface, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: THEME.radius.base, padding: THEME.spacing.m, fontSize: 16, color: THEME.colors.text, marginBottom: THEME.spacing.m },
    selectedSection: { marginBottom: THEME.spacing.m },
    selectedLabel: { color: THEME.colors.textSecondary, marginBottom: THEME.spacing.xs },
    loadingContainer: { padding: THEME.spacing.xl, alignItems: 'center' },
    emptyState: { padding: THEME.spacing.xl, alignItems: 'center' },
    userItem: { flexDirection: 'row', alignItems: 'center', padding: THEME.spacing.m, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
    userItemSelected: { backgroundColor: THEME.colors.surfaceGray },
    userItemInfo: { flex: 1, marginLeft: THEME.spacing.m },
    userItemDetail: { color: THEME.colors.textSecondary },
});
