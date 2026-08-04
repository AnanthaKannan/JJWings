import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = 200;

export interface PostOptionsMenuProps {
  /** Current privacy state of the post, so the label can flip appropriately */
  // isPrivate: boolean;
  onDelete: () => void;
  // onTogglePrivate: () => void;
}

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  // isPrivate,
  onDelete,
  // onTogglePrivate,
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

  const handleDelete = useCallback(() => {
    closeMenu();
    // Slight delay so the menu modal fully dismisses before the alert opens
    setTimeout(() => {
      Alert.alert(
        'Delete post?',
        "This can't be undone.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ],
        { cancelable: true },
      );
    }, 150);
  }, [closeMenu, onDelete]);

  // const handleTogglePrivate = useCallback(() => {
  //   closeMenu();
  //   onTogglePrivate();
  // }, [closeMenu, onTogglePrivate]);

  return (
    <>
      <TouchableOpacity
        ref={anchorRef}
        onPress={openMenu}
        hitSlop={10}
        style={styles.trigger}
      >
        <MaterialIcons name="more-vert" size={22} color="#65676b" />
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
                {/* <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleTogglePrivate}
                >
                  <MaterialIcons
                    name={isPrivate ? 'public' : 'lock-outline'}
                    size={20}
                    color="#050505"
                  />
                  <Text style={styles.menuItemText}>
                    {isPrivate ? 'Make public' : 'Make private'}
                  </Text>
                </TouchableOpacity> */}

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
                    Delete post
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
    padding: 6,
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
