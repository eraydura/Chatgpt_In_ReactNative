import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet,Text,TouchableOpacity,Image,ScrollView ,Modal,Pressable,TextInput} from 'react-native';
import {GiftedChat} from 'react-native-gifted-chat';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import Spinner from 'react-native-loading-spinner-overlay';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
var chat = "Assistant acts like coming from future. Assistant speaks english. He can talk about future. He's very nice and amusing.";

function ChatBot({ route, navigation }) {
  const[messages,setMessages]= useState([])
  const[prevmessages,setPrevMessages]= useState([])
  const[id,setId]= useState(0)
  const [db, setDb] = useState(SQLite.openDatabase('chatbot.db'));
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [behaviour,setBehaviour]= useState("");
  const [modalVisible,setModalVisible]=useState(true);



  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT)')
    });
    
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM names', null,
        (txObj, resultSet) => resultSet.rows._array.map((name,date, index) => {
          setPrevMessages(previousMessages => [...previousMessages,name.name]);
        }),
        (txObj, error) => console.log(error)
      );
    });
     
  }, [db]);


  const handleSend = async(newMessages=[]) => {
    try{
      if(route.params){
         setBehaviour(route.params.chatbot);
      }
      const userMessage= newMessages[0];
      const messageText= userMessage.text.toLowerCase();

      setMessages(previousMessages => GiftedChat.append(previousMessages,userMessage));

    db.transaction(tx => {
      tx.executeSql('INSERT INTO names (name,date) values (?,?)', [messageText, new Date().toString()],
        (txObj, error) => console.log(error)
      );
    });
     setLoading(true);
     const response=await axios.post('https://api.openai.com/v1/engines/text-davinci-003/completions',{
          prompt: behaviour+"\n\nHuman: "+messageText+" \nAssistant:",
          max_tokens: 50,
          temperature: 0.2,
          n:1,
       },{
          headers:{
            'Content-Type':'application/json',
            'Authorization': 'Bearer <Your ChatGPT code>',
          }
     });

     const future= response.data.choices[0].text.trim();
     const botMessage ={
       _id: new Date().getTime()+1,
       text: future,
       createdAt: new Date(),
       user:{
         _id: 2,
         name: 'Future Bot'
       }
     };
     setMessages(previousMessages => GiftedChat.append(previousMessages,botMessage));

    db.transaction(tx => {
      tx.executeSql('INSERT INTO names (name,date) values (?,?)', ["1"+future, new Date().toString()],
        (txObj, error) => console.log(error)
      );
    });
    setLoading(false);
    }catch(error){
        console.log(error);
    }
  };


   return(
     <View style={styles.container}>
        <Spinner
          //visibility of Overlay Loading Spinner
          visible={loading}
          //Text with the Spinner
          textContent={'Loading...'}
          //Text style of the Spinner Text
          textStyle={styles.spinnerTextStyle}
        />
          <GiftedChat
              messages={messages}
              onSend={newMessages=>handleSend(newMessages)}
              user={{id:1}}
          />
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.touchableOpacityStyle}        
          onPress={() => {
            navigation.navigate('Previous Messages',{message: prevmessages});
          }}>
          <Image
            source={{
              uri:
                'https://icons.iconarchive.com/icons/johanchalibert/mac-osx-yosemite/256/messages-icon.png',
            }}
            style={styles.floatingButtonStyle}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.touchableOpacityStyle2}        
          onPress={() => {
            navigation.navigate('Write Your ChatBot');
          }}>
          <Image
            source={{
              uri:
                'https://cdn.dribbble.com/users/136232/screenshots/2929466/media/56bdeff530fc57a3785cda42e10f589a.gif',
            }}
            style={styles.floatingButtonStyle}
          />
        </TouchableOpacity>

     </View>
    );
}


function Previous({ route, navigation }) {

  return (
    <ScrollView style={{ flex: 1 }}>
       {route.params.message.map((item)=>( item.toString().startsWith('1') ? <Text  style={{alignSelf: 'flex-start',backgroundColor: "green", color: "white"}}>{item}</Text>: <Text style={{alignSelf: 'flex-end',backgroundColor: "blue", color: "white"}}>{item}</Text>))}
    </ScrollView>
  );
}

function Behaviour({ route, navigation }) {
  const [text, onChangeText] = useState(chat);
  return (
     <View style={styles.centeredView}>
       <Text> Write about how to behave your Chatbot </Text>
       <TextInput
        style={styles.input}
        onChangeText={onChangeText}
        value={text}
      />
        <TouchableOpacity
          activeOpacity={0.7}       
          onPress={() => {
            chat=text
            navigation.navigate('Chatbot',{chatbot:text});
          }}>
          <Image
            source={{
              uri:
                'https://cdn.dribbble.com/users/136232/screenshots/2929466/media/56bdeff530fc57a3785cda42e10f589a.gif',
            }}
            style={styles.floatingButtonStyle}
          />
        </TouchableOpacity>
    </View>
  );
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="chatbot" detachInactiveScreens>
        <Stack.Screen name="Chatbot" component={ChatBot} />
        <Stack.Screen name="Previous Messages" component={Previous} />
        <Stack.Screen name="Write Your ChatBot" component={Behaviour} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex:1
  },
  spinnerTextStyle: {
    color: '#FFF',
  },
  touchableOpacityStyle: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
  },
  floatingButtonStyle: {
    resizeMode: 'contain',
    width: 50,
    height: 50,
    //backgroundColor:'black'
  },

  touchableOpacityStyle2: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 100,
  },
  floatingButtonStyle: {
    resizeMode: 'contain',
    width: 50,
    height: 50,
    //backgroundColor:'black'
  },
  input: {
    width: 200,
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});

