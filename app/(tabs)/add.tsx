
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,


} from 'react-native';

import{
    SafeAreaView
}from 'react-native-safe-area-context';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View>
                    <Text>List your thing</Text>
            </View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({


    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',

    },

    titleContainer: {
        alignItems: 'center',
        fontSize:16,
    }
});
