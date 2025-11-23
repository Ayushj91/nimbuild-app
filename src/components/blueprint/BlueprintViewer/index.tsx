import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Heading, Body, Icon } from '../../../components';
import { THEME } from '../../../theme/Theme';
import { Blueprint, BlueprintMarker } from '../../../types/api';
import { ReactNativeZoomableView } from '@dudigital/react-native-zoomable-view';
import { useRequest } from '../../../hooks/useRequest';
import { blueprintService } from '../../../services/api/blueprintService';
import { downloadFile } from '../../../services/downloadService';
import { useToast } from '../../../contexts/ToastContext';

interface BlueprintViewerProps {
    visible: boolean;
    blueprintId: string;
    projectId: string;
    highlightMarkerId?: string;
    onClose: () => void;
    onMarkerPress?: (marker: BlueprintMarker) => void;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
    visible,
    blueprintId,
    projectId,
    highlightMarkerId,
    onClose,
    onMarkerPress,
}) => {
    const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
    const [markers, setMarkers] = useState<BlueprintMarker[]>([]);
    const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
    const [downloading, setDownloading] = useState(false);
    const toast = useToast();

    const { request: fetchBlueprint, loading: loadingBlueprint } = useRequest(
        blueprintService.getBlueprint,
        {
            onSuccess: (data) => setBlueprint(data),
        }
    );

    const { request: fetchMarkers, loading: loadingMarkers } = useRequest(
        blueprintService.listMarkers,
        {
            onSuccess: (response) => setMarkers(response.markers),
        }
    );

    useEffect(() => {
        if (visible && blueprintId && projectId) {
            fetchBlueprint(projectId, blueprintId);
            fetchMarkers(blueprintId, { includeTaskDetails: true });
        }
    }, [blueprintId, projectId, fetchBlueprint, fetchMarkers, visible]);

    const handleDownload = async () => {
        if (!blueprint || downloading) return;

        setDownloading(true);
        try {
            const result = await downloadFile(blueprint.fileUrl, blueprint.filename);
            if (result.success) {
                toast.showToast({ message: `Downloaded: ${blueprint.filename} `, type: 'success' });
            } else {
                toast.showToast({ message: result.error || 'Download failed', type: 'error' });
            }
        } catch (error: any) {
            toast.showToast({ message: error.message || 'Download failed', type: 'error' });
        } finally {
            setDownloading(false);
        }
    };

    const renderMarkers = () => {
        if (imageLayout.width === 0 || markers.length === 0) return null;

        return markers.map((marker) => {
            const isHighlighted = marker.id === highlightMarkerId;
            const markerColor = marker.color || THEME.colors.error;

            return (
                <TouchableOpacity
                    key={marker.id}
                    style={[
                        styles.marker,
                        {
                            left: marker.x * imageLayout.width - 20,
                            top: marker.y * imageLayout.height - 40,
                        },
                        isHighlighted && styles.highlightedMarker,
                    ]}
                    onPress={() => onMarkerPress?.(marker)}>
                    <Icon name="map-marker" size="xl" color={markerColor} />
                    {marker.label && (
                        <View style={styles.markerLabel}>
                            <Body size="sm" style={styles.markerLabelText} numberOfLines={1}>
                                {marker.label}
                            </Body>
                        </View>
                    )}
                    {isHighlighted && (
                        <View style={styles.markerPulse} />
                    )}
                </TouchableOpacity>
            );
        });
    };

    const loading = loadingBlueprint || loadingMarkers;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <Icon name="arrow-left" size="lg" color={THEME.colors.text} />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Heading level={3} numberOfLines={1}>
                                Blueprint
                            </Heading>
                            {blueprint && (
                                <Body size="sm" style={styles.subtitle} numberOfLines={1}>
                                    {blueprint.filename}
                                </Body>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Body size="sm" style={styles.markerCount}>
                            {markers.length} {markers.length === 1 ? 'marker' : 'markers'}
                        </Body>
                    </View>
                    {blueprint && (
                        <TouchableOpacity
                            onPress={handleDownload}
                            disabled={downloading}
                            style={styles.downloadButton}>
                            {downloading ? (
                                <ActivityIndicator size="small" color={THEME.colors.primary} />
                            ) : (
                                <Icon name="download" size="lg" color={THEME.colors.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={THEME.colors.primary} />
                        <Body style={styles.loadingText}>Loading blueprint...</Body>
                    </View>
                ) : blueprint ? (
                    <View style={styles.content}>
                        <ReactNativeZoomableView
                            maxZoom={3}
                            minZoom={1}
                            zoomStep={0.5}
                            initialZoom={1}
                            bindToBorders={true}
                            style={styles.zoomableView}>
                            <View
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
                                {renderMarkers()}
                            </View>
                        </ReactNativeZoomableView>

                        {markers.length > 0 && (
                            <View style={styles.legend}>
                                <Icon name="information" size="sm" color={THEME.colors.info} />
                                <Body size="sm" style={styles.legendText}>
                                    Tap markers to view task details. Pinch to zoom.
                                </Body>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.errorContainer}>
                        <Icon
                            name="alert-circle"
                            size="xl"
                            color={THEME.colors.error}
                        />
                        <Body style={styles.errorText}>Failed to load blueprint</Body>
                    </View>
                )}
            </View>
        </Modal>
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
    backButton: {
        marginRight: THEME.spacing.m,
    },
    titleContainer: {
        flex: 1,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        marginTop: 2,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    markerCount: {
        color: THEME.colors.textSecondary,
        fontWeight: '600',
    },
    downloadButton: {
        padding: THEME.spacing.s,
        marginLeft: THEME.spacing.m,
    },
    content: {
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
    highlightedMarker: {
        zIndex: 10,
    },
    markerPulse: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(245, 158, 11, 0.3)',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    markerLabel: {
        position: 'absolute',
        top: -30,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        maxWidth: 150,
    },
    markerLabelText: {
        color: THEME.colors.white,
    },
    legend: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.s,
        padding: THEME.spacing.m,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    legendText: {
        flex: 1,
        color: THEME.colors.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: THEME.spacing.m,
    },
    loadingText: {
        color: THEME.colors.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: THEME.spacing.m,
    },
    errorText: {
        color: THEME.colors.error,
        marginTop: THEME.spacing.s,
    },
    zoomableView: {
        flex: 1,
    },
});
