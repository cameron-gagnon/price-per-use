import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text, TextInput, Modal, Portal, Surface, HelperText } from 'react-native-paper';
import { Group, CreateGroupInput } from '../types';
import itemService from '../services/itemService';
import ColorPicker from './ColorPicker';

interface GroupSelectorProps {
  selectedGroupId?: number | null;
  onGroupSelect: (groupId: number | null) => void;
  onGroupCreated?: (group: Group) => void;
  disabled?: boolean;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedGroupId,
  onGroupSelect,
  onGroupCreated,
  disabled = false,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6200EE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupsData = await itemService.getAllGroups();
      setGroups(groupsData);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const groupData: CreateGroupInput = {
        name: newGroupName.trim(),
        color: newGroupColor,
      };
      
      const newGroup = await itemService.createGroup(groupData);
      
      // Add to local groups list
      setGroups([...groups, newGroup]);
      
      // Select the new group
      onGroupSelect(newGroup.id);
      onGroupCreated?.(newGroup);
      
      // Reset form and close modal
      setNewGroupName('');
      setNewGroupColor('#6200EE');
      setCreateModalVisible(false);
      setMenuVisible(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setMenuVisible(false);
    setCreateModalVisible(true);
    setError(null);
  };

  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
    setNewGroupName('');
    setNewGroupColor('#6200EE');
    setError(null);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const buttonText = selectedGroup ? selectedGroup.name : 'Ungrouped';

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(true)}
            disabled={disabled}
            style={styles.selectorButton}
            contentStyle={styles.buttonContent}
          >
            {buttonText}
          </Button>
        }
        contentStyle={styles.menu}
      >
        <Menu.Item
          title="Ungrouped"
          onPress={() => {
            onGroupSelect(null);
            setMenuVisible(false);
          }}
          leadingIcon={selectedGroupId === null ? 'check' : undefined}
        />
        
        {groups.map((group) => (
          <Menu.Item
            key={group.id}
            title={group.name}
            onPress={() => {
              onGroupSelect(group.id);
              setMenuVisible(false);
            }}
            leadingIcon={group.id === selectedGroupId ? 'check' : undefined}
            titleStyle={{ color: group.color }}
          />
        ))}
        
        <Menu.Item
          title="Create New Group..."
          onPress={handleOpenCreateModal}
          leadingIcon="plus"
        />
      </Menu>

      <Portal>
        <Modal
          visible={createModalVisible}
          onDismiss={handleCloseCreateModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Create New Group
            </Text>
            
            <TextInput
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              mode="outlined"
              style={styles.input}
              error={!!error}
              disabled={loading}
            />
            
            {error && (
              <HelperText type="error" visible={true}>
                {error}
              </HelperText>
            )}
            
            <ColorPicker
              selectedColor={newGroupColor}
              onColorSelect={setNewGroupColor}
              label="Group Color"
            />
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={handleCloseCreateModal}
                style={styles.modalButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateGroup}
                style={styles.modalButton}
                loading={loading}
                disabled={loading}
              >
                Create
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  selectorButton: {
    justifyContent: 'flex-start',
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
  menu: {
    maxHeight: 300,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSurface: {
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default GroupSelector;