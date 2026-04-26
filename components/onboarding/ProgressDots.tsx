import { StyleSheet, View } from 'react-native';

const ORANGE = '#F07B2A';

type Props = {
  total: number;
  current: number;
};

export default function ProgressDots({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  active: {
    width: 24,
    backgroundColor: ORANGE,
  },
  inactive: {
    width: 8,
    backgroundColor: 'rgba(240, 123, 42, 0.25)',
  },
});
