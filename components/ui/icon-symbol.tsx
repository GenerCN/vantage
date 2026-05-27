// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Partial<
  Record<
    SymbolViewProps["name"],
    ComponentProps<typeof MaterialIcons>["name"]
  >
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "arrow.right.circle.fill": "history",
  "person.fill": "person",
  "list.bullet": "format-list-bulleted",
  "cpu": "developer-board",
  "wifi": "wifi",
  "mappin.and.ellipse": "place",
  "scale.3d": "scale",
  "cube.box.fill": "inventory",
  "pencil": "edit",
  "trash": "delete",
  "creditcard": "credit-card",
  "checkmark.circle": "check-circle",
  "hourglass": "access-time",
  "xmark": "close",
  "calendar": "today",
  "bell.fill": "notifications",
  "exclamationmark.triangle": "warning",
  "link": "link",
  "clock": "access-time",
  "inbox": "inbox",
  "arrow.up.right": "call-made",
  "arrow.down.left": "call-received",
  "arrow.triangle.2.circlepath": "sync",
  "plus": "add",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  if (name === "scale.3d") {
    return (
      <MaterialCommunityIcons
        color={color}
        size={size}
        name="scale-balance"
        style={style}
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]!}
      style={style}
    />
  );
}
