import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Appbar, Card, Text, Button, ActivityIndicator, IconButton, Dialog, Portal, TextInput, Menu, Modal, Surface, HelperText, Icon } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ItemWithUsage, UsageRecord, Group, CreateGroupInput } from '../types';
import itemService from '../services/itemService';
import ColorPicker from '../components/ColorPicker';

interface ItemDetailScreenProps {
  navigation?: any;
  route?: {
    params: {
      itemId: number;
    };
  };
}

export const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { itemId } = route?.params || { itemId: 0 };
  const [item, setItem] = useState<ItemWithUsage | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUsageDialog, setShowAddUsageDialog] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [shouldResetDateTime, setShouldResetDateTime] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6200EE');
  const [groupError, setGroupError] = useState<string | null>(null);
  const nameInputRef = useRef<any>(null);

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setError(null);
      const [itemData, history, groupsData] = await Promise.all([
        itemService.getItemWithUsage(itemId),
        itemService.getUsageHistory(itemId),
        itemService.getAllGroups(),
      ]);
      setItem(itemData);
      setUsageHistory(history);
      setGroups(groupsData);

      // Load group information if item has a group
      if (itemData.group_id) {
        const groupData = await itemService.getGroup(itemData.group_id);
        setCurrentGroup(groupData);
      } else {
        setCurrentGroup(null);
      }
    } catch (err) {
      console.error('Failed to load item details:', err);
      setError('Failed to load item details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrementUsage = () => {
    if (shouldResetDateTime) {
      setSelectedDateTime(new Date());
      setShouldResetDateTime(false);
    }
    setShowAddUsageDialog(true);
  };

  const handleAddUsageConfirm = async () => {
    if (!item) return;

    try {
      const dateTimeString = selectedDateTime.toISOString();
      await itemService.incrementUsage(item.id, dateTimeString);
      await loadItemDetails();
      setShowAddUsageDialog(false);
      setShouldResetDateTime(true); // Reset for next usage
    } catch (err) {
      console.error('Failed to add usage:', err);
      setError('Failed to add usage. Please try again.');
    }
  };

  const handleAddUsageCancel = () => {
    setShowAddUsageDialog(false);
  };

  const handleNameEdit = () => {
    if (item) {
      setEditedName(item.name);
      setIsEditingName(true);
    }
  };

  const handleNameSave = async () => {
    if (!item || !editedName.trim()) {
      // If empty name, cancel instead of save
      handleNameCancel();
      return;
    }

    try {
      await itemService.updateItem(item.id, { name: editedName.trim() });
      await loadItemDetails();
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update item name:', err);
      setError('Failed to update item name. Please try again.');
      // Stay in edit mode if there was an error
    }
  };

  const handleNameCancel = () => {
    if (nameInputRef.current) {
      nameInputRef.current.blur();
    }
    setIsEditingName(false);
    setEditedName(item?.name || ''); // Reset to original name
  };

  const handleGroupEditClick = () => {
    setGroupMenuVisible(true);
  };

  const handleGroupSelect = async (groupId: number | null) => {
    if (!item) return;

    try {
      await itemService.updateItem(item.id, { group_id: groupId });
      await loadItemDetails();
      setGroupMenuVisible(false);
    } catch (err) {
      console.error('Failed to update item group:', err);
      setError('Failed to update item group. Please try again.');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setGroupError('Group name is required');
      return;
    }

    setLoading(true);
    setGroupError(null);

    try {
      const groupData: CreateGroupInput = {
        name: newGroupName.trim(),
        color: newGroupColor,
      };

      const newGroup = await itemService.createGroup(groupData);

      // Add to local groups list
      setGroups([...groups, newGroup]);

      // Select the new group
      await handleGroupSelect(newGroup.id);

      // Reset form and close modal
      setNewGroupName('');
      setNewGroupColor('#6200EE');
      setCreateGroupModalVisible(false);
      setGroupMenuVisible(false);
    } catch (err: any) {
      setGroupError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateGroupModal = () => {
    setGroupMenuVisible(false);
    setCreateGroupModalVisible(true);
    setGroupError(null);
  };

  const handleCloseCreateGroupModal = () => {
    setCreateGroupModalVisible(false);
    setNewGroupName('');
    setNewGroupColor('#6200EE');
    setGroupError(null);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const updatedDateTime = new Date(selectedDateTime);
      updatedDateTime.setFullYear(date.getFullYear());
      updatedDateTime.setMonth(date.getMonth());
      updatedDateTime.setDate(date.getDate());
      setSelectedDateTime(updatedDateTime);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const updatedDateTime = new Date(selectedDateTime);
      updatedDateTime.setHours(date.getHours());
      updatedDateTime.setMinutes(date.getMinutes());
      setSelectedDateTime(updatedDateTime);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    try {
      await itemService.deleteItem(item.id);
      navigation?.goBack();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleDeleteUsage = async (usageRecord: UsageRecord) => {
    Alert.alert(
      'Delete Usage Record',
      `Delete usage from ${itemService.formatDateTime(usageRecord.usage_date)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await itemService.deleteUsageRecord(usageRecord.id);
              await loadItemDetails(); // Refresh the data
            } catch (err) {
              console.error('Failed to delete usage record:', err);
              setError('Failed to delete usage record. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation?.goBack()} />
          <Appbar.Content title="Item Details" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation?.goBack()} />
          <Appbar.Content title="Item Details" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>Item not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        {isEditingName ? (
          <View style={styles.headerEditContainer}>
            <TextInput
              ref={nameInputRef}
              value={editedName}
              onChangeText={setEditedName}
              style={styles.headerEditInput}
              autoFocus
              onSubmitEditing={handleNameSave}
              onBlur={() => {
                // Small delay to ensure state updates properly
                setTimeout(() => {
                  if (isEditingName) {
                    handleNameCancel();
                  }
                }, 100);
              }}
              returnKeyType="done"
              blurOnSubmit={true}
              maxLength={50}
            />
          </View>
        ) : (
          <>
            <Appbar.Content
              title={item.name}
              titleStyle={styles.headerTitle}
            />
            <Appbar.Action
              icon="pencil"
              onPress={handleNameEdit}
            />
          </>
        )}
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.priceContainer}>
              <Text variant="displayMedium" style={styles.pricePerUse}>
                {itemService.formatCurrency(item.price_per_use)}
              </Text>
              <Text variant="bodyLarge" style={styles.priceLabel}>
                per use
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Original Price</Text>
                <Text variant="bodyLarge">{itemService.formatCurrency(item.price)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Times Used</Text>
                <Text variant="bodyLarge">{item.usage_count}</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Purchase Date</Text>
                <Text variant="bodyLarge">{itemService.formatDate(item.purchase_date)}</Text>
              </View>
            </View>

            <View style={styles.groupContainer}>
              <Text variant="bodySmall" style={styles.statLabel}>Group</Text>
              <View style={styles.groupDisplayRow}>
                <View style={styles.groupDisplayContainer}>
                  <Menu
                    visible={groupMenuVisible}
                    onDismiss={() => setGroupMenuVisible(false)}
                    anchor={
                      <View style={styles.groupDisplayFlex}>
                        <Text
                          variant="bodyLarge"
                          style={styles.groupNameTextFlex}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {currentGroup ? currentGroup.name : 'Ungrouped'}
                        </Text>
                        {currentGroup && (
                          <View
                            style={[styles.groupColorIndicatorFlex, { backgroundColor: currentGroup.color }]}
                          />
                        )}
                      </View>
                    }
                    contentStyle={styles.menu}
                  >
                    <Menu.Item
                      title="Ungrouped"
                      onPress={() => handleGroupSelect(null)}
                      leadingIcon={item.group_id === null ? 'check' : undefined}
                    />

                    {groups.map((group) => (
                      <Menu.Item
                        key={group.id}
                        title={group.name}
                        onPress={() => handleGroupSelect(group.id)}
                        leadingIcon={group.id === item.group_id ? 'check' : undefined}
                        titleStyle={{ color: group.color }}
                      />
                    ))}

                    <Menu.Item
                      title="Create New Group..."
                      onPress={handleOpenCreateGroupModal}
                      leadingIcon="plus"
                    />
                  </Menu>
                </View>
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor="#666"
                  onPress={handleGroupEditClick}
                  style={styles.editIcon}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleIncrementUsage}
            style={styles.button}
            icon="plus"
          >
            Add Usage
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.button}
            buttonColor="#ffebee"
            textColor="#c62828"
          >
            Delete Item
          </Button>
        </View>

        {usageHistory.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Usage History
              </Text>
              {usageHistory.map((record, index) => (
                <View key={record.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <Text variant="bodyMedium">
                      {itemService.formatDateTime(record.usage_date)}
                    </Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#c62828"
                      onPress={() => handleDeleteUsage(record)}
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showAddUsageDialog} onDismiss={handleAddUsageCancel}>
          <Dialog.Title>Add Usage</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dateTimeContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateTimeButton}
                icon="calendar"
              >
                {selectedDateTime.toLocaleDateString()}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.dateTimeButton}
                icon="clock-outline"
              >
                {selectedDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleAddUsageCancel}>Cancel</Button>
            <Button onPress={handleAddUsageConfirm}>Add Usage</Button>
          </Dialog.Actions>
        </Dialog>

        <Modal
          visible={createGroupModalVisible}
          onDismiss={handleCloseCreateGroupModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Create New Group
            </Text>

            <TextInput
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              mode="outlined"
              style={styles.input}
              error={!!groupError}
              disabled={loading}
            />

            {groupError && (
              <HelperText type="error" visible={true}>
                {groupError}
              </HelperText>
            )}

            <ColorPicker
              selectedColor={newGroupColor}
              onColorSelect={setNewGroupColor}
              label="Group Color"
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={handleCloseCreateGroupModal}
                style={styles.modalButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateGroup}
                style={styles.modalButton}
                loading={loading}
                disabled={loading}
              >
                Create
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  nameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  itemName: {
    textAlign: 'center',
    flex: 1,
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  pricePerUse: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  priceLabel: {
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  dateTimeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  nameEditContainer: {
    marginBottom: 16,
    padding: 8,
  },
  nameEditInput: {
    // No additional styles needed - just use the default TextInput styling
  },
  groupContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  groupDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  groupDisplayContainer: {
    flex: 1,
    marginRight: 8,
  },
  groupEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  groupDisplay: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    minWidth: 120, // Ensure adequate space for group display
    maxWidth: '88%', // Reserve space for edit button
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0, // Allow flex child to shrink
  },
  groupNameText: {
    flex: 1,
    marginRight: 6,
    minWidth: 90, // Ensure space for ~15 characters
    fontSize: 16,
  },
  groupColorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 3,
    flexShrink: 0, // Prevent the color indicator from shrinking
  },
  editIcon: {
    margin: 4,
    minWidth: 48, // Ensure minimum touch target size
    flexShrink: 0, // Prevent the icon from shrinking
  },
  groupDisplayFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  groupNameTextFlex: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  groupColorIndicatorFlex: {
    width: 14,
    height: 14,
    borderRadius: 7,
    flexShrink: 0, // Prevent the color indicator from shrinking
  },
  menu: {
    maxHeight: 300,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSurface: {
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerEditContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerEditInput: {
    backgroundColor: '#fff',
    fontSize: 16,
    height: 40,
  },
});

export default ItemDetailScreen;
