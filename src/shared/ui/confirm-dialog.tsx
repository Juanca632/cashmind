import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Layout, Radius, Size } from '@/shared/theme/theme';
import { Button } from '@/shared/ui/button';
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
            <Button label={request.cancel} variant="quiet" size="compact" stretch onPress={onCancel} />
            <Button label={request.confirm} variant="danger" size="compact" stretch onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Layout.dialogPadding,
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    borderRadius: Radius.dialog,
    gap: Layout.itemGap,
    maxWidth: Size.dialog,
    padding: Layout.dialogPadding,
    width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    gap: Layout.itemGap,
    marginTop: Layout.sectionGap,
  },
});
