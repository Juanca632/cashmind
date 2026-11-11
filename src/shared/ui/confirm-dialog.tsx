import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

export type ConfirmRequest = {
  title: string;
  message: string;
  /** The safe choice: closes the dialog and changes nothing. */
  cancel: string;
  /** The destructive choice. */
  confirm: string;
  onConfirm: () => void;
};

/**
 * The app's confirmation for anything that deletes or discards. `ask` opens it; render `dialog`
 * once in the screen. A tap outside the card and Android's back button both cancel.
 */
export function useConfirm(): { dialog: ReactNode; ask: (request: ConfirmRequest) => void } {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = () => setRequest(null);
  const dialog = request ? (
    <ConfirmDialog
      request={request}
      onCancel={close}
      onConfirm={() => {
        close();
        request.onConfirm();
      }}
    />
  ) : null;
  return { dialog, ask: setRequest };
}

function ConfirmDialog({
  request,
  onCancel,
  onConfirm,
}: {
  request: ConfirmRequest;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <View style={styles.center}>
        <Pressable accessible={false} testID="confirm-dialog-backdrop" onPress={onCancel} style={[StyleSheet.absoluteFill, styles.scrim]} />
        <View testID="confirm-dialog" accessibilityViewIsModal style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="heading" accessibilityRole="header">
            {request.title}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{request.message}</ThemedText>
          <View style={styles.buttons}>
            <DialogButton label={request.cancel} fill={theme.background} ink={theme.text} onPress={onCancel} />
            <DialogButton label={request.confirm} fill={theme.errorFill} ink={theme.onAccent} onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DialogButton({ label, fill, ink, onPress }: { label: string; fill: string; ink: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: fill }, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: ink }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    borderRadius: Radius.hero,
    gap: Spacing.two,
    maxWidth: 360,
    padding: Spacing.four,
    width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flex: 1,
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
