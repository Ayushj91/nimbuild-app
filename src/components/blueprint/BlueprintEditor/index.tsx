import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    Image,
    Pressable,
} from 'react-native';
import { Heading, Body, Button, Icon } from '../../../components';
import { THEME } from '../../../theme/Theme';
import { Blueprint } from '../../../types/api';
import { ReactNativeZoomableView } from '@dudigital/react-native-zoomable-view';
import Pdf from 'react-native-pdf';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlueprintEditorProps {
    blueprint: Blueprint;
    projectId: string;
    onSave: (marker: { x: number; y: number; label?: string }) => void;
    onCancel: () => void;
}

export const BlueprintEditor: React.FC<BlueprintEditorProps> = ({
    blueprint,
    onSave,
    onCancel,
}) => {
    const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null);
    const [label] = useState('');
    const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

    const isPDF = blueprint.fileType === 'pdf';

    const handlePress = (event: any) => {
        if (isPDF) {
            // For PDF, we'll handle this differently
            return;
        }

        // Get touch position relative to the image
        const { locationX, locationY } = event.nativeEvent;

        if (imageLayout.width === 0 || imageLayout.height === 0) {
            return;
        }

        // Calculate normalized coordinates (0-1 range)
        const normalizedX = locationX / imageLayout.width;
        const normalizedY = locationY / imageLayout.height;

        // Clamp to valid range
        const x = Math.max(0, Math.min(1, normalizedX));
        const y = Math.max(0, Math.min(1, normalizedY));

        setMarkerPosition({ x, y });
    };

    const handleSave = () => {
        if (!markerPosition) {
            Alert.alert('No Marker', 'Please tap on the blueprint to place a marker');
            return;
        }

        onSave({
            x: markerPosition.x,
            y: markerPosition.y,
            label: label.trim() || undefined,
        });
    };

    const handleCancel = () => {
        Alert.alert('Discard Changes?', 'The marker you placed will not be saved.', [
            { text: 'Continue Editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]);
    };

    const renderMarker = () => {
        if (!markerPosition || imageLayout.width === 0) return null;

        return (
            <View
                style={[
                    styles.marker,
                    {
                        left: markerPosition.x * imageLayout.width - 20,
                        top: markerPosition.y * imageLayout.height - 40,
                    },
                ]}>
                <Icon name="map-marker" size="xl" color={THEME.colors.error} />
            </View>
        );
    };

    const renderImageEditor = () => (
        <View style={styles.zoomContainer}>
            <ReactNativeZoomableView
                maxZoom={3}
                minZoom={1}
                zoomStep={0.5}
                initialZoom={1}
                bindToBorders={true}
                style={styles.zoomableView}>
                <Pressable
                    onPress={handlePress}
                    style={styles.imageContainer}
                    onLayout={(event) => {
                        const { width, height } = event.nativeEvent.layout;
                        setImageLayout({ width, height });
                    }}>
                    <Image
                        source={{ uri: blueprint.fileUrl }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    {renderMarker()}
                </Pressable>
            </ReactNativeZoomableView>
        </View>
    );

    const renderPDFEditor = () => (
        <View style={styles.pdfContainer}>
            <Pdf
                source={{ uri: blueprint.fileUrl }}
                style={styles.pdf}
                onLoadComplete={(numberOfPages) => {
                    console.log(`PDF loaded: ${numberOfPages} pages`);
                }}
                onError={(error) => {
                    console.error('PDF error:', error);
                    Alert.alert('Error', 'Failed to load PDF');
                }}
            />
            <View style={styles.pdfInstructions}>
                <Body style={styles.instructionText}>
                    PDF annotation coming soon. Please use image blueprints for now.
                </Body>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                        <Icon name="close" size="lg" color={THEME.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Heading level={3} numberOfLines={1}>
                            Place Marker
                        </Heading>
                        <Body size="sm" style={styles.subtitle} numberOfLines={1}>
                            {blueprint.filename}
                        </Body>
                    </View>
                </View>
                <Button
                    title="Save"
                    onPress={handleSave}
                    variant="primary"
                    size="sm"
                    disabled={!markerPosition}
                />
            </View>

            <View style={styles.instructions}>
                <Icon name="information" size="sm" color={THEME.colors.info} />
                <Body size="sm" style={styles.instructionText}>
                    {isPDF
                        ? 'PDF support is limited. Use image blueprints for best experience.'
                        : markerPosition
                            ? 'Marker placed! Tap Save to confirm or tap again to move it.'
                            : 'Tap anywhere on the blueprint to place a marker'}
                </Body>
            </View>

            {isPDF ? renderPDFEditor() : renderImageEditor()}

            {markerPosition && !isPDF && (
                <View style={styles.footer}>
                    <View style={styles.coordinatesInfo}>
                        <Body size="sm" style={styles.coordinatesLabel}>
                            Marker Position:
                        </Body>
                        <Body size="sm" style={styles.coordinates}>
                            X: {(markerPosition.x * 100).toFixed(1)}%, Y:{' '}
                            {(markerPosition.y * 100).toFixed(1)}%
                        </Body>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: THEME.spacing.m,
    },
    cancelButton: {
        marginRight: THEME.spacing.m,
    },
    titleContainer: {
        flex: 1,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        marginTop: 2,
    },
    instructions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.s,
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.infoLight,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    instructionText: {
        flex: 1,
        color: THEME.colors.text,
    },
    zoomContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    marker: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfContainer: {
        flex: 1,
    },
    pdf: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    pdfInstructions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: THEME.spacing.l,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    footer: {
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.white,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
    },
    coordinatesInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coordinatesLabel: {
        color: THEME.colors.textSecondary,
    },
    coordinates: {
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    zoomableView: {
        flex: 1,
    },
});
