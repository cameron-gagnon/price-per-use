import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import AddItemForm from '../components/AddItemForm';
import { CreateItemInput } from '../types';
import itemService from '../services/itemService';

interface AddItemScreenProps {
  navigation: any;
  onItemAdded?: () => void;
}

export const AddItemScreen: React.FC<AddItemScreenProps> = ({
  navigation,
  onItemAdded,
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (itemData: CreateItemInput) => {
    setLoading(true);
    try {
      await itemService.createItem(itemData);
      onItemAdded?.();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title="Add Item" />
      </Appbar.Header>
      
      <AddItemForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AddItemScreen;