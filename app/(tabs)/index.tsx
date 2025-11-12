import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator, Modal, KeyboardAvoidingView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [certNumber, setCertNumber] = useState('');
  const [dotCount, setDotCount] = useState(1);
  const [permission, requestPermission] = useCameraPermissions();
  const colors = Colors[colorScheme ?? 'light'];
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    if (!certModalVisible) return;

    let direction = 1; // 1 for increasing, -1 for decreasing
    let count = 1;

    const interval = setInterval(() => {
      count += direction;

      if (count === 3) {
        direction = -1;
      } else if (count === -1) {
        direction = 1;
        count = 0;
      }

      setDotCount(count);
    }, 300);

    return () => clearInterval(interval);
  }, [certModalVisible]);

  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      console.error('Camera ref not available');
      return;
    }

    try {
      setLoading(true);
      console.log('=== START TAKE PICTURE ===');

      // Take picture
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Lower quality for faster upload
      });
      console.log('Picture taken:', photo?.uri, 'width:', photo?.width, 'height:', photo?.height);

      if (!photo) {
        console.error('No photo returned');
        setLoading(false);
        return;
      }

      // Get current user
      console.log('Getting user session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('User session:', session?.user?.id);

      if (!session?.user) {
        console.error('No user session');
        setLoading(false);
        return;
      }

      // Generate unique filename
      const userId = session.user.id;
      const uuid = Crypto.randomUUID();
      const filePath = `${userId}/${uuid}.jpg`;
      console.log('File path:', filePath);

      // Read the file as base64
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Base64 length:', base64.length);

      // Decode base64 to binary
      console.log('Converting to binary...');
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('Bytes array length:', bytes.length, 'bytes (~', Math.round(bytes.length / 1024), 'KB)');

      // Upload to Supabase storage
      console.log('Starting upload to Supabase storage bucket: cards');
      console.log('Upload size check - will upload:', Math.round(bytes.length / 1024 / 1024 * 100) / 100, 'MB');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cards')
        .upload(filePath, bytes, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error message:', uploadError.message);
        console.error('Upload error details:', JSON.stringify(uploadError));
        setLoading(false);
        return;
      }

      console.log('Upload successful:', uploadData);
      console.log('Image uploaded to:', filePath);

      // Call edge function
      console.log('Calling edge function with image path:', filePath);
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'scrape-ebay-from-cert',
        {
          body: { image_path: filePath },
        }
      );

      if (functionError) {
        console.error('Function error:', functionError);
        console.error('Function error message:', functionError.message);
        console.error('Function error details:', JSON.stringify(functionError));
        setLoading(false);
        return;
      }

      console.log('Function result:', functionData);
      console.log('Function success:', functionData?.success);

      // Process results and navigate to results screen
      if (functionData.success) {
        const cardData = {
          imageUri: photo.uri,
          psa_card: functionData.psa_card,
          listings: functionData.listings,
          statistics: functionData.statistics,
        };

        // Navigate to results screen with card data
        router.push({
          pathname: '/card-results',
          params: {
            data: JSON.stringify(cardData),
          },
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      setLoading(false);
    }
  };

  const handleUpload = () => {
    setCertModalVisible(true);
  };

  const handleCertNumberSubmit = async () => {
    if (certNumber.trim()) {
      setCertModalVisible(false);
      // TODO: Implement cert number lookup
      setCertNumber('');
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Scanning card...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, flex: 1, paddingTop: insets.top }]}>
      <View style={styles.cameraWindow}>
        {!permission ? (
          // Loading permissions
          <ThemedView style={styles.permissionContainer}>
            <ActivityIndicator size="small" color={colors.tint} />
            <ThemedText style={styles.cameraText}>Loading camera...</ThemedText>
          </ThemedView>
        ) : !permission.granted ? (
          // Need to request permission
          <ThemedView style={styles.permissionContainer}>
            <View style={styles.smallCornerIcon}>
              <View style={[styles.smallCorner, styles.smallTopLeft, { borderColor: colors.tint }]} />
              <View style={[styles.smallCorner, styles.smallTopRight, { borderColor: colors.tint }]} />
              <View style={[styles.smallCorner, styles.smallBottomLeft, { borderColor: colors.tint }]} />
              <View style={[styles.smallCorner, styles.smallBottomRight, { borderColor: colors.tint }]} />
            </View>
            <ThemedText style={styles.cameraText}>Camera access required</ThemedText>
            <Pressable
              style={[styles.permissionButton, { backgroundColor: colors.tint }]}
              onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>
          </ThemedView>
        ) : (
          // Show camera preview
          <>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.cameraOverlay}>
              <View style={styles.smallCornerIcon}>
                <View style={[styles.smallCorner, styles.smallTopLeft, { borderColor: 'white' }]} />
                <View style={[styles.smallCorner, styles.smallTopRight, { borderColor: 'white' }]} />
                <View style={[styles.smallCorner, styles.smallBottomLeft, { borderColor: 'white' }]} />
                <View style={[styles.smallCorner, styles.smallBottomRight, { borderColor: 'white' }]} />
              </View>
              <Text style={[styles.cameraText, { color: 'white' }]}>
                Ready to Scan
              </Text>
            </View>
          </>
        )}
      </View>

      <ThemedView style={[styles.buttonsContainer, { paddingHorizontal: 16, paddingBottom: 24 }]}>
        <Pressable
          style={[styles.largeButton, { backgroundColor: colors.tint }]}
          onPress={handleTakePicture}>
          <View style={styles.tinyCornerIcon}>
            <View style={[styles.tinyCorner, styles.tinyTopLeft, { borderColor: 'white' }]} />
            <View style={[styles.tinyCorner, styles.tinyTopRight, { borderColor: 'white' }]} />
            <View style={[styles.tinyCorner, styles.tinyBottomLeft, { borderColor: 'white' }]} />
            <View style={[styles.tinyCorner, styles.tinyBottomRight, { borderColor: 'white' }]} />
          </View>
          <Text style={styles.largeButtonText}>Take Picture</Text>
        </Pressable>

        <Pressable
          style={[styles.largeButton, { borderColor: colors.tint, borderWidth: 1, backgroundColor: 'transparent' }]}
          onPress={handleUpload}>
          <IconSymbol name="pencil" size={14} color={colors.tint} />
          <Text style={[styles.largeButtonText, { color: colors.tint }]}>Certification Number</Text>
        </Pressable>
      </ThemedView>

      {/* Certification Number Modal */}
      <Modal
        visible={certModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCertModalVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>Enter Certification Number</ThemedText>
                <Pressable onPress={() => setCertModalVisible(false)}>
                  <IconSymbol name="xmark" size={24} color={colors.text} />
                </Pressable>
              </View>

              {/* Display input value */}
              <View style={[styles.certNumberDisplay, { borderColor: '#001f3f' }]}>
                <ThemedText style={[styles.certNumberText, { color: '#001f3f' }]}>
                  {certNumber || '.'.repeat(dotCount)}
                </ThemedText>
              </View>

              {/* Number Keypad */}
              <View style={styles.keypadContainer}>
                <View style={styles.keypad}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <Pressable
                      key={num}
                      style={[styles.keypadButton]}
                      onPress={() => setCertNumber(certNumber + num.toString())}
                    >
                      <ThemedText style={styles.keypadButtonText}>{num}</ThemedText>
                    </Pressable>
                  ))}

                  {/* Backspace button */}
                  <Pressable
                    style={[styles.keypadButton]}
                    onPress={() => setCertNumber(certNumber.slice(0, -1))}
                  >
                    <IconSymbol name="delete.left" size={18} color={colors.text} />
                  </Pressable>
                </View>

                {/* Enter Button */}
                <Pressable
                  style={[styles.enterButton, { opacity: certNumber ? 1 : 0.5 }]}
                  onPress={handleCertNumberSubmit}
                  disabled={!certNumber}
                >
                  <ThemedText style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Enter</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  cameraWindow: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    pointerEvents: 'none',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  cameraText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  cornerIcon: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  smallCornerIcon: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  smallCorner: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  smallTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopLeftRadius: 4,
  },
  smallTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopRightRadius: 4,
  },
  smallBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomLeftRadius: 4,
  },
  smallBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomRightRadius: 4,
  },
  tinyCornerIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  tinyCorner: {
    position: 'absolute',
    width: 6,
    height: 6,
  },
  tinyTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 2,
  },
  tinyTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderTopRightRadius: 2,
  },
  tinyBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderBottomLeftRadius: 2,
  },
  tinyBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomLeftRadius: 2,
  },
  buttonCornerIcon: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  buttonCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  buttonTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopLeftRadius: 4,
  },
  buttonTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopRightRadius: 4,
  },
  buttonBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomLeftRadius: 4,
  },
  buttonBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomRightRadius: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },
  buttonsContainer: {
    gap: 12,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  largeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
  },
  cardPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    paddingVertical: 40,
    marginBottom: 24,
  },
  cardImage: {
    width: 240,
    height: 320,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDetailsContainer: {
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cardSet: {
    opacity: 0.5,
    fontSize: 13,
    fontWeight: '400',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    borderColor: '#e5e5e5',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 8,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  conditionBadge: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  salesList: {
    gap: 0,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  saleDetail: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '400',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  modalContent: {
    height: '50%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  certNumberDisplay: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: 'rgba(0,31,63,0.02)',
  },
  certNumberText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  keypadContainer: {
    gap: 12,
    flex: 0,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: '31%',
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  keypadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlignVertical: 'center',
  },
  enterButton: {
    width: '100%',
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#001f3f',
  },
});
