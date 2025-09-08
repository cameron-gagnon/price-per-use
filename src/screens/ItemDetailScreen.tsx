import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Card, Text, Button, ActivityIndicator } from 'react-native-paper';
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

  const handleIncrementUsage = async () => {
    if (!item) return;
    
    try {
      await itemService.incrementUsage(item.id);
      await loadItemDetails();
    } catch (err) {
      console.error('Failed to increment usage:', err);
      setError('Failed to update usage. Please try again.');
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
            <Text variant="headlineSmall" style={styles.itemName}>
              {item.name}
            </Text>
            
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
              {usageHistory.slice(0, 10).map((record, index) => (
                <View key={record.id} style={styles.historyItem}>
                  <Text variant="bodyMedium">
                    {itemService.formatDateTime(record.usage_date)}
                  </Text>
                </View>
              ))}
              {usageHistory.length > 10 && (
                <Text variant="bodySmall" style={styles.moreText}>
                  ... and {usageHistory.length - 10} more
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
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
  moreText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
});

export default ItemDetailScreen;