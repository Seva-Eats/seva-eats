import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
};

export default function BackNavButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.button}>
      <MaterialIcons name="arrow-back-ios-new" size={18} color="#2A2A2A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9DED3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9F4',
  },
});
