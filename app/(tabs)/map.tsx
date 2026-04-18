import { StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

export default function MapScreen() {
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 45.8150,
                    longitude: 15.9819,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}

                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={true}
                pitchEnabled={true}
                showsUserLocation={true}

            >
                <UrlTile
                    urlTemplate="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
                    minimumZ={0}
                    maximumZ={19}
                />
                <Marker
                    coordinate={{ latitude: 45.8150, longitude: 15.9819 }}
                    title="Zagreb"
                />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});