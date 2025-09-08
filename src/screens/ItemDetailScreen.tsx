import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Appbar, Card, Text, Button, ActivityIndicator, IconButton, Dialog, Portal, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ItemWithUsage, UsageRecord } from '../types';
import itemService from '../services/itemService';

interface ItemDetailScreenProps {
  navigation: any;
  route: {
    params: {
      itemId: number;
    };
  };
}

export const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { itemId } = route.params;
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

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setError(null);
      const [itemData, history] = await Promise.all([
        itemService.getItemWithUsage(itemId),
        itemService.getUsageHistory(itemId),
      ]);
      setItem(itemData);
      setUsageHistory(history);
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

  const handleNameLongPress = () => {
    if (item) {
      setEditedName(item.name);
      setIsEditingName(true);
    }
  };

  const handleNameSave = async () => {
    if (!item || !editedName.trim()) return;
    
    try {
      await itemService.updateItem(item.id, { name: editedName.trim() });
      await loadItemDetails();
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update item name:', err);
      setError('Failed to update item name. Please try again.');
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
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
      navigation.goBack();
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
          <Appbar.BackAction onPress={() => navigation.goBack()} />
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
          <Appbar.BackAction onPress={() => navigation.goBack()} />
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
        <Appbar.Content title={item.name} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {isEditingName ? (
              <View style={styles.nameEditContainer}>
                <TextInput
                  value={editedName}
                  onChangeText={setEditedName}
                  style={styles.nameEditInput}
                  mode="outlined"
                  autoFocus
                  onSubmitEditing={handleNameSave}
                />
                <View style={styles.nameEditButtons}>
                  <IconButton
                    icon="check"
                    size={20}
                    iconColor="#4CAF50"
                    onPress={handleNameSave}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    iconColor="#f44336"
                    onPress={handleNameCancel}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity onLongPress={handleNameLongPress}>
                <Text variant="headlineSmall" style={styles.itemName}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            
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
  itemName: {
    textAlign: 'center',
    marginBottom: 16,
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
  },
  nameEditInput: {
    marginBottom: 8,
  },
  nameEditButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ItemDetailScreen;