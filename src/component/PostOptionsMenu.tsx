import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = 200;

export interface PostOptionsMenuProps {
  onDelete: () => void;
  icon?: string;
}

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  onDelete,
  icon = 'more-vert',
}) => {
  const anchorRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const openMenu = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      const left = Math.min(
        x + width - MENU_WIDTH,
        SCREEN_WIDTH - MENU_WIDTH - 8,
      );
      setPosition({ top: y + height + 4, left: Math.max(left, 8) });
      setVisible(true);
    });
  }, []);

  const closeMenu = useCallback(() => setVisible(false), []);

  const handleDelete = () => {
    closeMenu();
    onDelete();
  };

  return (
    <>
      <TouchableOpacity
        ref={anchorRef}
        onPress={openMenu}
        hitSlop={10}
        style={styles.trigger}
      >
        <MaterialIcons name={icon} size={22} color="#65676b" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.menu,
                  { top: position.top, left: position.left },
                ]}
              >
                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDelete}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color="#e41e3f"
                  />
                  <Text style={[styles.menuItemText, styles.deleteText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    // padding: 6,
  },
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#050505',
  },
  deleteText: {
    color: '#e41e3f',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e6eb',
    marginHorizontal: 8,
  },
});

export default PostOptionsMenu;
