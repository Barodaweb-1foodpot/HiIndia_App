import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ViewTickets = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Button title="Back" onPress={() => navigation.goBack()} />
            <Text style={styles.text}>View Tickets</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontSize: 20,
    },
});

export default ViewTickets;