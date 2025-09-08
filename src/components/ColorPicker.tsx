import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, TouchableRipple, Modal, Portal, Button, IconButton } from 'react-native-paper';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label?: string;
}

const DEFAULT_COLORS = [
  '#6200EE', // Purple (Primary)
  '#3700B3', // Dark Purple
  '#BB86FC', // Light Purple
  '#03DAC6', // Teal
  '#018786', // Dark Teal
  '#00BCD4', // Light Blue
  '#2196F3', // Blue
  '#1976D2', // Dark Blue
  '#4CAF50', // Green
  '#388E3C', // Dark Green
  '#8BC34A', // Light Green
  '#CDDC39', // Lime
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
];

const EXTENDED_COLORS = [
  // Reds
  '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C',
  // Pinks
  '#FCE4EC', '#F8BBD9', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F',
  // Purples
  '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C',
  // Deep Purples
  '#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92',
  // Indigos
  '#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E',
  // Blues
  '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1',
  // Light Blues
  '#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B',
  // Cyans
  '#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064',
  // Teals
  '#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40',
  // Greens
  '#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20',
  // Light Greens
  '#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E',
  // Limes
  '#F9FBE7', '#F0F4C3', '#E6EE9C', '#DCE775', '#D4E157', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717',
  // Yellows
  '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#F9A825', '#F57F17',
  // Ambers
  '#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00',
  // Oranges
  '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100',
  // Deep Oranges
  '#FBE9E7', '#FFCCBC', '#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C',
  // Browns
  '#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723',
  // Greys
  '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121',
];

export default function ColorPicker({ selectedColor, onColorSelect, label = "Color" }: ColorPickerProps) {
  const [showExtended, setShowExtended] = useState(false);

  const ColorSwatch = ({ color, isSelected, onPress }: { color: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableRipple
      onPress={onPress}
      style={[
        styles.colorSwatch,
        { backgroundColor: color },
        isSelected && styles.selectedSwatch
      ]}
    >
      <View style={styles.swatchInner}>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: getContrastColor(color) }]} />
        )}
      </View>
    </TouchableRipple>
  );

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={styles.label}>{label}</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.selectedColorRow}>
            <View 
              style={[
                styles.selectedColorPreview, 
                { backgroundColor: selectedColor }
              ]} 
            />
            <Text variant="bodyMedium" style={styles.selectedColorText}>
              {selectedColor.toUpperCase()}
            </Text>
          </View>
          
          <Text variant="bodySmall" style={styles.sectionTitle}>Default Colors</Text>
          <View style={styles.colorGrid}>
            {DEFAULT_COLORS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                isSelected={selectedColor === color}
                onPress={() => onColorSelect(color)}
              />
            ))}
          </View>

          <View style={styles.moreColorsRow}>
            <Button
              mode="text"
              onPress={() => setShowExtended(true)}
              icon="palette"
              compact
            >
              More Colors
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={showExtended}
          onDismiss={() => setShowExtended(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall">Choose Color</Text>
            <IconButton
              icon="close"
              onPress={() => setShowExtended(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.extendedColorGrid}>
              {EXTENDED_COLORS.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  isSelected={selectedColor === color}
                  onPress={() => {
                    onColorSelect(color);
                    setShowExtended(false);
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  card: {
    elevation: 2,
  },
  selectedColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  selectedColorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedColorText: {
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: '#000',
    elevation: 4,
  },
  swatchInner: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moreColorsRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  extendedColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});