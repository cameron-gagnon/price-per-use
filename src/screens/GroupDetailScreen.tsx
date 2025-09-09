import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Appbar, Card, Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { Group, GroupWithItems } from '../types';
import itemService from '../services/itemService';
import ColorPicker from '../components/ColorPicker';

interface GroupDetailScreenProps {
  navigation?: any;
  route?: {
    params: {
      groupId: number;
    };
  };
}

export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { groupId } = route?.params || { groupId: 0 };
  const [group, setGroup] = useState<Group | null>(null);
  const [groupWithItems, setGroupWithItems] = useState<GroupWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#6200EE');

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setError(null);
      const [groupData, groupedData] = await Promise.all([
        itemService.getGroup(groupId),
        itemService.getItemsGroupedWithUsage(),
      ]);
      
      if (!groupData) {
        setError('Group not found');
        setLoading(false);
        return;
      }

      setGroup(groupData);
      setSelectedColor(groupData.color);
      
      // Find the group with items from the grouped data
      const foundGroup = groupedData.find(g => g.group_id === groupId);
      setGroupWithItems(foundGroup || null);
    } catch (err) {
      console.error('Failed to load group details:', err);
      setError('Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleColorSave = async () => {
    if (!group) return;
    
    try {
      await itemService.updateGroup(group.id, { color: selectedColor });
      await loadGroupDetails();
      setIsEditingColor(false);
    } catch (err) {
      console.error('Failed to update group color:', err);
      setError('Failed to update group color. Please try again.');
    }
  };

  const handleColorCancel = () => {
    setSelectedColor(group?.color || '#6200EE');
    setIsEditingColor(false);
  };

  const handleDelete = async () => {
    if (!group) return;
    
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? Items in this group will become ungrouped.`,
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
              await itemService.deleteGroup(group.id);
              navigation?.goBack();
            } catch (err) {
              console.error('Failed to delete group:', err);
              setError('Failed to delete group. Please try again.');
            }
          },
        },
      ]
    );
  };

  const calculateGroupStats = () => {
    if (!groupWithItems || !groupWithItems.items.length) {
      return {
        totalPrice: 0,
        totalPricePerUse: 0,
        averagePricePerUse: 0,
        itemCount: 0,
      };
    }

    const items = groupWithItems.items;
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const totalPricePerUse = items.reduce((sum, item) => sum + item.price_per_use, 0);
    const averagePricePerUse = totalPricePerUse / items.length;

    return {
      totalPrice,
      totalPricePerUse,
      averagePricePerUse,
      itemCount: items.length,
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation?.goBack()} />
          <Appbar.Content title="Group Details" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation?.goBack()} />
          <Appbar.Content title="Group Details" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>Group not found</Text>
        </View>
      </View>
    );
  }

  const stats = calculateGroupStats();

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: group.color }}>
        <Appbar.BackAction onPress={() => navigation?.goBack()} />
        <Appbar.Content title={group.name} titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.colorSection}>
              <Text variant="bodySmall" style={styles.sectionLabel}>Group Color</Text>
              <View style={styles.colorDisplayRow}>
                <View style={styles.colorDisplay}>
                  <View 
                    style={[styles.colorPreview, { backgroundColor: group.color }]} 
                  />
                  <Text variant="bodyLarge" style={styles.colorText}>
                    {group.color.toUpperCase()}
                  </Text>
                </View>
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor="#666"
                  onPress={() => setIsEditingColor(true)}
                  style={styles.editIcon}
                />
              </View>
              
              {isEditingColor && (
                <View style={styles.colorEditSection}>
                  <ColorPicker
                    selectedColor={selectedColor}
                    onColorSelect={setSelectedColor}
                    label="New Group Color"
                  />
                  <View style={styles.colorEditButtons}>
                    <Button
                      mode="outlined"
                      onPress={handleColorCancel}
                      style={styles.colorButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleColorSave}
                      style={styles.colorButton}
                    >
                      Save Color
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Group Statistics
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Items in Group</Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {stats.itemCount}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Total Original Price</Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {itemService.formatCurrency(stats.totalPrice)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Total Price Per Use</Text>
                <Text variant="headlineSmall" style={[styles.statValue, styles.primaryStat]}>
                  {itemService.formatCurrency(stats.totalPricePerUse)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Average Price Per Use</Text>
                <Text variant="headlineSmall" style={[styles.statValue, styles.primaryStat]}>
                  {itemService.formatCurrency(stats.averagePricePerUse)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            buttonColor="#ffebee"
            textColor="#c62828"
          >
            Delete Group
          </Button>
        </View>
      </ScrollView>
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
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  colorSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#666',
    marginBottom: 8,
  },
  colorDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorText: {
    fontFamily: 'monospace',
  },
  editIcon: {
    margin: 4,
    minWidth: 48,
    flexShrink: 0,
  },
  colorEditSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  colorEditButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  colorButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 24,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  statLabel: {
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  primaryStat: {
    color: '#1976D2',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: 16,
    marginBottom: 32,
  },
  deleteButton: {
    marginHorizontal: 32,
  },
});

export default GroupDetailScreen;