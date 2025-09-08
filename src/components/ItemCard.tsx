import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
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

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const getSecondaryTextColor = (hexColor: string) => {
    const contrastColor = getContrastColor(hexColor);
    return contrastColor === '#000000' ? '#666666' : '#CCCCCC';
  };

  const cardBackgroundColor = item.color || '#6200EE';
  const textColor = getContrastColor(cardBackgroundColor);
  const secondaryTextColor = getSecondaryTextColor(cardBackgroundColor);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Card style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={[styles.itemName, { color: textColor }]}>
              {item.name}
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text variant="displaySmall" style={[styles.pricePerUse, { color: textColor }]}>
                {itemService.formatCurrency(item.price_per_use)}
              </Text>
              <Text variant="bodyMedium" style={[styles.priceLabel, { color: secondaryTextColor }]}>
                {' '}per use
              </Text>
            </View>
            <Text variant="bodySmall" style={[styles.usageLabel, { color: secondaryTextColor }]}>
              after {item.usage_count} use{item.usage_count !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={[styles.footer, { borderTopColor: secondaryTextColor }]}>
            <Text variant="bodySmall" style={[styles.originalPrice, { color: secondaryTextColor }]}>
              Original: {itemService.formatCurrency(item.price)}
            </Text>
            <Text variant="bodySmall" style={[styles.purchaseDate, { color: secondaryTextColor }]}>
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
  priceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  pricePerUse: {
    fontWeight: 'bold',
    // color will be set dynamically
  },
  priceLabel: {
    // color will be set dynamically
    fontSize: 16,
  },
  usageLabel: {
    // color will be set dynamically
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    // borderTopColor will be set dynamically
  },
  originalPrice: {
    // color will be set dynamically
  },
  purchaseDate: {
    // color will be set dynamically
  },
});

export default ItemCard;