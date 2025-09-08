import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text, Badge } from 'react-native-paper';
import { ItemWithUsage } from '../types';
import itemService from '../services/itemService';

interface ItemCardProps {
  item: ItemWithUsage;
  onUsageIncrement: (itemId: number) => void;
  onLongPress: (item: ItemWithUsage) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onUsageIncrement, 
  onLongPress 
}) => {
  const handlePress = () => {
    onUsageIncrement(item.id);
  };

  const handleLongPress = () => {
    onLongPress(item);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.itemName}>
              {item.name}
            </Text>
            <Badge size={24} style={styles.usageBadge}>
              {item.usage_count}
            </Badge>
          </View>
          
          <View style={styles.priceContainer}>
            <Text variant="displaySmall" style={styles.pricePerUse}>
              {itemService.formatCurrency(item.price_per_use)}
            </Text>
            <Text variant="bodyMedium" style={styles.priceLabel}>
              per use
            </Text>
          </View>
          
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.originalPrice}>
              Original: {itemService.formatCurrency(item.price)}
            </Text>
            <Text variant="bodySmall" style={styles.purchaseDate}>
              {itemService.formatDate(item.purchase_date)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    fontWeight: 'bold',
  },
  usageBadge: {
    backgroundColor: '#6200EE',
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  pricePerUse: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  priceLabel: {
    color: '#666',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  originalPrice: {
    color: '#666',
  },
  purchaseDate: {
    color: '#666',
  },
});

export default ItemCard;