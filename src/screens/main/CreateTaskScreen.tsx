import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,

  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Heading, Body, Button, Icon, Avatar } from '../../components';
import { THEME } from '../../theme/Theme';
import { CreateTaskScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { taskService } from '../../services/api/taskService';
import { userService } from '../../services/api/userService';
import { TaskCategory, TaskStatus, User, Blueprint } from '../../types/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { BlueprintSelector, BlueprintEditor } from '../../components/blueprint';

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

export const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({
  route,
  navigation,
}) => {
  const { projectId } = route.params;

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
  const [priority] = useState<number>(0);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState<
    'start' | 'finish' | 'due' | null
  >(null);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'assignee' | 'cc'>('assignee');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  // Log searchResults changes
  useEffect(() => {
    console.log('📊 searchResults CHANGED, new length:', searchResults.length);
  }, [searchResults]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { request: createTask, loading } = useRequest(taskService.createTask, {
    onSuccess: () => {
      navigation.goBack();
    },
    successMessage: 'Task created successfully',
  });

  const { request: searchUsers } = useRequest(userService.searchUsers, {
    showErrorToast: true,
  });

  const handleSearchUsers = useCallback(async (query: string) => {
    console.log('Searching users with query:', query);
    setSearchLoading(true);
    try {
      const results = await searchUsers(query);
      console.log('Search results:', results);
      if (results) {
        setSearchResults(results);
        console.log('✅ searchResults STATE UPDATED, length:', results.length);
      }
    } catch (error) {
      console.error('Search users error:', error);
    } finally {
      setSearchLoading(false);
      console.log('✅ searchLoading SET TO FALSE');
    }
  }, [searchUsers]);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      handleSearchUsers(searchQuery.trim());
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleCamera = async () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to take photo');
          return;
        }
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setAttachments([
            ...attachments,
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
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to select images');
          return;
        }
        if (response.assets) {
          const newAttachments = response.assets.map((asset) => ({
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `image_${Date.now()}.jpg`,
          }));
          setAttachments([...attachments, ...newAttachments]);
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

      const newAttachments = results.map((file) => ({
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || `file_${Date.now()}`,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err: any) {
      if (err.code === 'DOCUMENT_PICKER_CANCELED') {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        Alert.alert('Error', 'Failed to select files');
        console.error('DocumentPicker error:', err);
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
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
      // CC mode - toggle user in list
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

  const handleMarkerSave = (marker: { x: number; y: number; label?: string }) => {
    setBlueprintMarker(marker);
    setShowBlueprintEditor(false);
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

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    createTask(projectId, {
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
      priority: priority,
      dueDate: dueDate?.toISOString(),
    }, attachments.length > 0 ? attachments : undefined);
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

  const renderUserSearchResult = ({ item }: { item: User }) => {
    try {
      console.log('🎨 Rendering user item:', item.name, item.id);
      const isSelected =
        userModalMode === 'cc' && ccUsers.find((u) => u.id === item.id);

      return (
        <TouchableOpacity
          style={[styles.userItem, isSelected && styles.userItemSelected]}
          onPress={() => handleSelectUser(item)}>
          <Avatar name={item.name} size="sm" />
          <View style={styles.userItemInfo}>
            <Body>{item.name || 'No Name'}</Body>
            <Body size="sm" style={styles.userItemDetail}>
              {item.phone || item.email}
            </Body>
          </View>
          {isSelected && (
            <Icon name="check-circle" size="sm" color={THEME.colors.success} />
          )}
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('❌ Error rendering user item:', error, item);
      return (
        <View style={styles.userItem}>
          <Body>Error rendering user: {item.name}</Body>
        </View>
      );
    }
  };

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
            <TouchableOpacity style={styles.mediaButton} onPress={handleDocument}>
              <Icon name="scan" size="lg" color={THEME.colors.textSecondary} />
              <View style={styles.addBadge}>
                <Icon name="plus" size="sm" color={THEME.colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    {isImage(attachment.type) ? (
                      <Image
                        source={{ uri: attachment.uri }}
                        style={styles.attachmentImage}
                      />
                    ) : (
                      <View style={styles.attachmentFile}>
                        <Icon
                          name="file-document"
                          size="lg"
                          color={THEME.colors.textSecondary}
                        />
                        <Body size="sm" numberOfLines={1} style={styles.fileName}>
                          {attachment.name}
                        </Body>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveAttachment(index)}>
                      <Icon name="close-circle" size="sm" color={THEME.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Title Field */}
          <View style={styles.fieldGroup}>
            <Body style={styles.label}>
              Title<Body style={styles.required}>*</Body>
            </Body>
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
            <Body style={styles.label}>
              Category<Body style={styles.required}>*</Body>
            </Body>
            <View style={styles.pillRow}>
              {CATEGORIES.map(renderCategoryButton)}
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Body style={styles.label}>
              Description<Body style={styles.required}>*</Body>
            </Body>
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
              <TouchableOpacity style={styles.inputIcon}>
                <Icon name="microphone" size="sm" color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location with Blueprint Option */}
          <View style={styles.fieldGroup}>
            <View style={styles.locationHeader}>
              <Body style={styles.label}>Location</Body>
              <TouchableOpacity
                style={styles.locationToggle}
                onPress={handleToggleLocationType}>
                <Icon
                  name={locationType === 'text' ? 'text' : 'image'}
                  size="sm"
                  color={THEME.colors.primary}
                />
                <Body size="sm" style={styles.toggleText}>
                  {locationType === 'text' ? 'Use Blueprint' : 'Use Text'}
                </Body>
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
                        <Body style={styles.blueprintName} numberOfLines={1}>
                          {selectedBlueprint.filename}
                        </Body>
                        <Body size="sm" style={styles.blueprintMeta}>
                          Marker at {(blueprintMarker.x * 100).toFixed(0)}%, {(blueprintMarker.y * 100).toFixed(0)}%
                        </Body>
                      </View>
                      <TouchableOpacity onPress={handleRemoveBlueprint}>
                        <Icon name="close" size="lg" color={THEME.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.blueprintPickerButton}
                    onPress={() => setShowBlueprintSelector(true)}>
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
              <TouchableOpacity
                style={styles.input}
                onPress={() => handleOpenUserModal('assignee')}>
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
            <TouchableOpacity
              style={styles.input}
              onPress={() => handleOpenUserModal('cc')}>
              <Body style={styles.placeholder}>
                {ccUsers.length > 0 ? 'Add more CC users' : 'Add CC users'}
              </Body>
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

          {/* Start & Finish Date */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, styles.halfField]}>
              <Body style={styles.label}>Start Date</Body>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker('start')}>
                <Body style={startDate ? styles.inputText : styles.placeholder}>
                  {formatDate(startDate) || 'Select date'}
                </Body>
              </TouchableOpacity>
            </View>
            <View style={[styles.fieldGroup, styles.halfField]}>
              <Body style={styles.label}>Finish Date</Body>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker('finish')}>
                <Body style={finishDate ? styles.inputText : styles.placeholder}>
                  {formatDate(finishDate) || 'Select date'}
                </Body>
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
            title="Create Task"
            onPress={handleCreate}
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

      {/* Blueprint Selector Modal */}
      {showBlueprintSelector && (
        <BlueprintSelector
          visible={showBlueprintSelector}
          projectId={projectId}
          onSelect={handleBlueprintSelect}
          onClose={() => setShowBlueprintSelector(false)}
        />
      )}

      {/* Blueprint Editor Modal */}
      {showBlueprintEditor && selectedBlueprint && (
        <BlueprintEditor
          blueprint={selectedBlueprint}
          projectId={projectId}
          onSave={handleMarkerSave}
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
              <Heading level={3}>
                {userModalMode === 'assignee' ? 'Select Assignee' : 'Select CC Users'}
              </Heading>
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
                <Body size="sm" style={styles.selectedLabel}>
                  Selected ({ccUsers.length})
                </Body>
              </View>
            )}

            {searchLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
              </View>
            ) : searchQuery.length < 2 ? (
              <View style={styles.emptyState}>
                <Body style={styles.emptyText}>
                  Type at least 2 characters to search
                </Body>
              </View>
            ) : searchResults.length === 0 ? (
              <>
                {console.log('🔍 UI: Showing "No users found" - searchResults.length:', searchResults.length)}
                <View style={styles.emptyState}>
                  <Body style={styles.emptyText}>No users found</Body>
                </View>
              </>
            ) : (
              <>
                {console.log('📋 UI: Rendering FlatList with', searchResults.length, 'users')}
                <FlatList
                  data={searchResults}
                  renderItem={renderUserSearchResult}
                  keyExtractor={(item) => item.id}
                  style={styles.resultsList}
                />
              </>
            )}

            {userModalMode === 'cc' && (
              <Button
                title="Done"
                onPress={() => setShowUserModal(false)}
                variant="primary"
                style={styles.modalDoneButton}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.l,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.m,
    marginBottom: THEME.spacing.l,
  },
  mediaButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.border,
    borderStyle: 'dashed',
    position: 'relative',
  },
  addBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentsPreview: {
    marginBottom: THEME.spacing.l,
  },
  attachmentItem: {
    marginRight: THEME.spacing.m,
    position: 'relative',
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
  },
  attachmentFile: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.s,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  fileName: {
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: THEME.colors.white,
    borderRadius: 12,
  },
  fieldGroup: {
    marginBottom: THEME.spacing.l,
  },
  label: {
    marginBottom: THEME.spacing.s,
    color: THEME.colors.text,
    fontWeight: '600',
  },
  required: {
    color: THEME.colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: THEME.spacing.m,
    fontFamily: THEME.typography.fontFamily.regular,
    fontSize: THEME.typography.fontSize.base,
    color: THEME.colors.text,
    backgroundColor: THEME.colors.white,
  },
  inputText: {
    color: THEME.colors.text,
  },
  placeholder: {
    color: THEME.colors.textTertiary,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: THEME.spacing.m,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  textArea: {
    height: 100,
    paddingRight: 48,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.s,
  },
  pillButton: {
    paddingHorizontal: THEME.spacing.l,
    paddingVertical: THEME.spacing.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  pillButtonSelected: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: THEME.colors.white,
  },
  pillButtonText: {
    color: THEME.colors.textSecondary,
  },
  pillButtonTextSelected: {
    color: THEME.colors.text,
    fontWeight: '600',
  },
  rowFields: {
    flexDirection: 'row',
    gap: THEME.spacing.m,
    marginBottom: THEME.spacing.l,
  },
  halfField: {
    flex: 1,
    marginBottom: 0,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.s,
    padding: THEME.spacing.s,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    backgroundColor: THEME.colors.white,
    marginBottom: THEME.spacing.s,
  },
  userChipText: {
    flex: 1,
  },
  ccUsersContainer: {
    marginBottom: THEME.spacing.s,
  },
  submitButton: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '70%',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : THEME.spacing.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  searchInput: {
    margin: THEME.spacing.l,
    marginBottom: THEME.spacing.m,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: THEME.spacing.m,
    fontFamily: THEME.typography.fontFamily.regular,
    fontSize: THEME.typography.fontSize.base,
    color: THEME.colors.text,
    backgroundColor: THEME.colors.white,
  },
  selectedSection: {
    paddingHorizontal: THEME.spacing.l,
    paddingBottom: THEME.spacing.s,
  },
  selectedLabel: {
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  resultsList: {
    flexGrow: 1,
    minHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.m,
    paddingHorizontal: THEME.spacing.l,
    gap: THEME.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  userItemSelected: {
    backgroundColor: THEME.colors.primaryLight,
  },
  userItemInfo: {
    flex: 1,
  },
  userItemDetail: {
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.textSecondary,
  },
  modalDoneButton: {
    margin: THEME.spacing.l,
  },
  // Blueprint-specific styles
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.s,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.xs,
  },
  toggleText: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  blueprintPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.m,
    padding: THEME.spacing.m,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: THEME.colors.primaryLight,
  },
  blueprintPickerText: {
    flex: 1,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  blueprintPreviewCard: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    backgroundColor: THEME.colors.white,
    padding: THEME.spacing.m,
  },
  blueprintPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.m,
  },
  blueprintPreviewInfo: {
    flex: 1,
  },
  blueprintName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  blueprintMeta: {
    color: THEME.colors.textSecondary,
  },
});
