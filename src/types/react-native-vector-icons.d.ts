declare module 'react-native-vector-icons/MaterialIcons' {
  import type { ComponentType } from 'react';
  import type { TextProps } from 'react-native';

  type IconProps = TextProps & {
    name: string;
    size?: number;
    color?: string;
  };

  const MaterialIcons: ComponentType<IconProps>;
  export default MaterialIcons;
}
