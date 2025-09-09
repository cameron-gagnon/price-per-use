import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, SectionList } from 'react-native';
import { Appbar, FAB, Text, ActivityIndicator, Surface, Searchbar, ToggleButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import ItemCard from '../components/ItemCard';
import GroupSection from '../components/GroupSection';
import { ItemWithUsage, GroupWithItems } from '../types';
import itemService from '../services/itemService';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [items, setItems] = useState<ItemWithUsage[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemWithUsage[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupWithItems[]>([]);
  const [filteredGroupedItems, setFilteredGroupedItems] = useState<GroupWithItems[]>([]);
  const [groups, setGroups] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');

  const loadItems = async () => {
    try {
      setError(null);
      const [itemsData, groupedData, groupsData] = await Promise.all([
        itemService.getAllItemsWithUsage(),
        itemService.getItemsGroupedWithUsage(),
        itemService.getAllGroups()
      ]);
      setItems(itemsData);
      setFilteredItems(itemsData);
      setGroupedItems(groupedData);
      setFilteredGroupedItems(groupedData);
      
      // Create a lookup map for group colors
      const groupColorMap: { [key: number]: string } = {};
      groupsData.forEach(group => {
        groupColorMap[group.id] = group.color;
      });
      setGroups(groupColorMap);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await itemService.initialize();
        await loadItems();
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to initialize app. Please restart.');
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadItems();
      }
    }, [loading])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleUsageIncrement = async (itemId: number) => {
    try {
      await itemService.incrementUsage(itemId);
      await loadItems();
    } catch (err) {
      console.error('Failed to increment usage:', err);
      setError('Failed to update usage. Please try again.');
    }
  };

  const handleItemLongPress = (item: ItemWithUsage) => {
    navigation.navigate('ItemDetail', { itemId: item.id });
  };

  const handleGroupLongPress = (groupId: number) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const handleAddItem = () => {
    navigation.navigate('AddItem');
  };

  const filterItems = (query: string) => {
    if (!query.trim()) {
      setFilteredItems(items);
      setFilteredGroupedItems(groupedItems);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    // Filter individual items (search by item name only in list view)
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery)
    );
    setFilteredItems(filtered);

    // Filter grouped items (search by both group names and item names)
    const filteredGroups = groupedItems.map(group => {
      const groupNameMatches = group.group_name.toLowerCase().includes(lowercaseQuery);
      const matchingItems = group.items.filter(item =>
        item.name.toLowerCase().includes(lowercaseQuery)
      );
      
      // Include group if either:
      // 1. Group name matches (show all items in that group)
      // 2. Some items match (show only matching items)
      if (groupNameMatches) {
        return { ...group }; // Show all items in this group
      } else if (matchingItems.length > 0) {
        return { ...group, items: matchingItems }; // Show only matching items
      }
      
      return null; // Don't include this group
    }).filter(group => group !== null);
    
    setFilteredGroupedItems(filteredGroups);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterItems(query);
  };

  useEffect(() => {
    filterItems(searchQuery);
  }, [items, groupedItems]);

  const renderItem = ({ item }: { item: ItemWithUsage }) => (
    <ItemCard
      item={item}
      onUsageIncrement={handleUsageIncrement}
      onLongPress={handleItemLongPress}
      groupColor={item.group_id ? groups[item.group_id] : null}
    />
  );

  const renderGroupItem = ({ item }: { item: GroupWithItems }) => (
    <GroupSection
      group={item}
      onUsageIncrement={handleUsageIncrement}
      onItemLongPress={handleItemLongPress}
      onGroupLongPress={handleGroupLongPress}
      initialExpanded={searchQuery.trim().length > 0}
    />
  );

  const renderEmptyState = () => {
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <Surface style={styles.emptyState}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {isSearching ? 'No items found' : 'No items yet'}
        </Text>
        <Text variant="bodyMedium" style={styles.emptyMessage}>
          {isSearching 
            ? `No items match "${searchQuery}". Try a different search term.`
            : 'Tap the + button to add your first item and start tracking its price per use!'
          }
        </Text>
      </Surface>
    );
  };

  const handleToggleView = () => {
    setViewMode(viewMode === 'list' ? 'grouped' : 'list');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Price Per Use" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Price Per Use" />
        <ToggleButton
          icon={viewMode === 'grouped' ? 'view-list' : 'view-module'}
          value={viewMode}
          onPress={handleToggleView}
          status={viewMode === 'grouped' ? 'checked' : 'unchecked'}
        />
      </Appbar.Header>

      <Searchbar
        placeholder="Search items..."
        onChangeText={handleSearchChange}
        value={searchQuery}
        style={styles.searchBar}
      />

      {error && (
        <Surface style={styles.errorBanner}>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
        </Surface>
      )}

      {viewMode === 'grouped' ? (
        <FlatList
          data={filteredGroupedItems}
          renderItem={renderGroupItem}
          keyExtractor={(group) => `group_${group.group_id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredGroupedItems.length === 0 ? styles.emptyContainer : undefined}
        />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredItems.length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 32,
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;