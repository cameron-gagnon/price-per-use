import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Divider, IconButton } from 'react-native-paper';
import { ItemWithUsage, GroupWithItems } from '../types';
import ItemCard from './ItemCard';

interface GroupSectionProps {
  group: GroupWithItems;
  onUsageIncrement: (itemId: number) => void;
  onItemLongPress: (item: ItemWithUsage) => void;
  initialExpanded?: boolean;
}

export const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  onUsageIncrement,
  onItemLongPress,
  initialExpanded = false
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
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

  const groupBackgroundColor = group.group_color || '#6200EE';
  const textColor = getContrastColor(groupBackgroundColor);
  const secondaryTextColor = getSecondaryTextColor(groupBackgroundColor);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleToggleExpanded}
        activeOpacity={0.7}
        style={styles.headerContainer}
      >
        <Card style={[styles.headerCard, { backgroundColor: groupBackgroundColor }]}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text variant="headlineSmall" style={[styles.groupName, { color: textColor }]}>
                {group.group_name}
              </Text>
              <Text variant="bodyMedium" style={[styles.itemCount, { color: secondaryTextColor }]}>
                {group.items.length} item{group.items.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <IconButton
              icon={expanded ? 'chevron-down' : 'chevron-right'}
              iconColor={textColor}
              size={24}
              onPress={handleToggleExpanded}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.itemsContainer}>
          {group.items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No items in this group yet
              </Text>
            </View>
          ) : (
            <View style={[styles.nestedItemsContainer, { borderLeftColor: groupBackgroundColor }]}>
              {group.items.map((item, index) => (
                <View key={item.id} style={styles.nestedItemWrapper}>
                  <ItemCard
                    item={item}
                    onUsageIncrement={onUsageIncrement}
                    onLongPress={onItemLongPress}
                    groupColor={group.group_color}
                  />
                  {index < group.items.length - 1 && (
                    <Divider style={styles.itemDivider} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
  },
  headerCard: {
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  groupName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 14,
    opacity: 0.8,
  },
  itemsContainer: {
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  itemDivider: {
    marginHorizontal: 32,
    opacity: 0.3,
  },
  nestedItemsContainer: {
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
  },
  nestedItemWrapper: {
    marginRight: 8,
  },
});

export default GroupSection;
