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
const DEFAULT_MENU_WIDTH = 200;

export interface MenuOption {
  /** Unique key for the option (used as React key) */
  key: string;
  /** Label text shown to the user */
  label: string;
  /** MaterialIcons icon name */
  icon: string;
  /** Icon color (defaults to textColor, or #050505) */
  iconColor?: string;
  /** Text color (defaults to #050505) */
  textColor?: string;
  /** Convenience flag: applies the standard destructive red to icon + text */
  destructive?: boolean;
  /** If provided, shows a confirmation Alert before calling onPress */
  confirm?: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  };
  /** Called when the option is chosen (after confirm, if any) */
  onPress: () => void;
  /** Disable this option */
  disabled?: boolean;
}

export interface OptionsMenuProps {
  /** List of options to render, top to bottom */
  options: MenuOption[];
  /** Icon shown on the trigger button (defaults to 'more-vert') */
  triggerIcon?: string;
  /** Trigger icon size (default 22) */
  triggerIconSize?: number;
  /** Trigger icon color (default #65676b) */
  triggerIconColor?: string;
  /** Menu width in px (default 200) */
  menuWidth?: number;
  /** Custom trigger element; overrides the default icon button if provided */
  renderTrigger?: (openMenu: () => void) => React.ReactNode;
}

const DESTRUCTIVE_COLOR = '#e41e3f';
const DEFAULT_TEXT_COLOR = '#050505';

const OptionsMenu: React.FC<OptionsMenuProps> = ({
  options,
  triggerIcon = 'more-vert',
  triggerIconSize = 22,
  triggerIconColor = '#65676b',
  menuWidth = DEFAULT_MENU_WIDTH,
  renderTrigger,
}) => {
  const anchorRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const openMenu = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      const left = Math.min(
        x + width - menuWidth,
        SCREEN_WIDTH - menuWidth - 8,
      );
      setPosition({ top: y + height + 4, left: Math.max(left, 8) });
      setVisible(true);
    });
  }, [menuWidth]);

  const closeMenu = useCallback(() => setVisible(false), []);

  const handleOptionPress = useCallback(
    (option: MenuOption) => {
      closeMenu();

      if (option.confirm) {
        // Slight delay so the menu modal fully dismisses before the alert opens
        setTimeout(() => {
          Alert.alert(
            option.confirm!.title,
            option.confirm!.message ?? '',
            [
              { text: option.confirm!.cancelText ?? 'Cancel', style: 'cancel' },
              {
                text: option.confirm!.confirmText ?? 'Confirm',
                style: 'destructive',
                onPress: option.onPress,
              },
            ],
            { cancelable: true },
          );
        }, 150);
        return;
      }

      option.onPress();
    },
    [closeMenu],
  );

  return (
    <>
      {renderTrigger ? (
        <View ref={anchorRef} collapsable={false}>
          {renderTrigger(openMenu)}
        </View>
      ) : (
        <TouchableOpacity
          ref={anchorRef}
          onPress={openMenu}
          hitSlop={10}
          style={styles.trigger}
        >
          <MaterialIcons
            name={triggerIcon}
            size={triggerIconSize}
            color={triggerIconColor}
          />
        </TouchableOpacity>
      )}

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
                  { top: position.top, left: position.left, width: menuWidth },
                ]}
              >
                {options.map((option, index) => {
                  const color = option.destructive
                    ? DESTRUCTIVE_COLOR
                    : option.textColor ?? DEFAULT_TEXT_COLOR;
                  const iconColor = option.destructive
                    ? DESTRUCTIVE_COLOR
                    : option.iconColor ?? color;

                  return (
                    <React.Fragment key={option.key}>
                      {index > 0 && <View style={styles.divider} />}
                      <TouchableOpacity
                        style={[
                          styles.menuItem,
                          option.disabled && styles.menuItemDisabled,
                        ]}
                        disabled={option.disabled}
                        onPress={() => handleOptionPress(option)}
                      >
                        <MaterialIcons
                          name={option.icon}
                          size={20}
                          color={iconColor}
                        />
                        <Text style={[styles.menuItemText, { color }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
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
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e6eb',
    marginHorizontal: 8,
  },
});

export default OptionsMenu;
