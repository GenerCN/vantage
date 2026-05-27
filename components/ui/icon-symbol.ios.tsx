import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // En iOS, el símbolo nativo 'scale.3d' representa ejes tridimensionales (tres nodos conectados).
  // Lo interceptamos para renderizar 'scalemass', que es la báscula de pesaje oficial de Apple.
  const iosName = name === ('scale.3d' as any) ? 'scalemass' : name;

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={iosName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
