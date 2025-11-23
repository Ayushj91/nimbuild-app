declare module '@dudigital/react-native-zoomable-view' {
    import { Component } from 'react';
    import { ViewProps, ViewStyle } from 'react-native';

    export interface ReactNativeZoomableViewProps extends ViewProps {
        zoomEnabled?: boolean;
        initialZoom?: number;
        minZoom?: number;
        maxZoom?: number;
        zoomStep?: number;
        bindToBorders?: boolean;
        onZoomAfter?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
        style?: ViewStyle;
    }

    export class ReactNativeZoomableView extends Component<ReactNativeZoomableViewProps> { }
}
