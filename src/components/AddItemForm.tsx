import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { CreateItemInput, Group } from '../types';
import ColorPicker from './ColorPicker';
import GroupSelector from './GroupSelector';
import itemService from '../services/itemService';

interface AddItemFormProps {
  onSubmit: (item: CreateItemInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedColor, setSelectedColor] = useState('#6200EE');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Item name is required';
    }

    const priceValue = parseFloat(price);
    if (!price || isNaN(priceValue) || priceValue <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0';
    }

    if (!purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const itemData: CreateItemInput = {
      name: name.trim(),
      price: parseFloat(price),
      purchase_date: new Date(purchaseDate).toISOString(),
      color: selectedColor,
      group_id: selectedGroupId,
    };

    try {
      await onSubmit(itemData);
      setName('');
      setPrice('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSelectedColor('#6200EE');
      setSelectedGroupId(null);
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to create item. Please try again.' });
    }
  };

  const handleGroupCreated = (group: Group) => {
    // Automatically select the newly created group
    setSelectedGroupId(group.id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text variant="headlineSmall" style={styles.title}>
          Add New Item
        </Text>

        <TextInput
          label="Item Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          disabled={loading}
          maxLength={50}
        />
        <HelperText type="error" visible={!!errors.name}>
          {errors.name}
        </HelperText>

        <TextInput
          label="Price"
          value={price}
          onChangeText={setPrice}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
          error={!!errors.price}
          disabled={loading}
          left={<TextInput.Affix text="$" />}
        />
        <HelperText type="error" visible={!!errors.price}>
          {errors.price}
        </HelperText>

        <TextInput
          label="Purchase Date"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          mode="outlined"
          style={styles.input}
          error={!!errors.purchaseDate}
          disabled={loading}
          placeholder="YYYY-MM-DD"
        />
        <HelperText type="error" visible={!!errors.purchaseDate}>
          {errors.purchaseDate}
        </HelperText>

        <GroupSelector
          selectedGroupId={selectedGroupId}
          onGroupSelect={setSelectedGroupId}
          onGroupCreated={handleGroupCreated}
          disabled={loading}
        />
        
        <ColorPicker
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          label="Item Color"
        />

        {errors.submit && (
          <HelperText type="error" visible={true} style={styles.submitError}>
            {errors.submit}
          </HelperText>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.button}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Add Item
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  submitError: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default AddItemForm;