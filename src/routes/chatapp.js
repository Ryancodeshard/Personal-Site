import "../css/chatapp.css"
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Input, useDisclosure } from '@chakra-ui/react'
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL="wss://smvtb9ary4.execute-api.ap-southeast-1.amazonaws.com/production";

function UsernamePrompt({websocket}){
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(()=>{
        onOpen();
    },[onOpen])

    const handleKeyDown = (websocket,name) => {
        websocket.current.send(JSON.stringify({"action":"setName","name":name}));
        onClose();
    }

    return (
        <AlertDialog
            isOpen={isOpen}
            closeOnOverlayClick={false}
            onClose={onClose}
        >
            <AlertDialogOverlay>
            <AlertDialogContent>
                <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                Welcome to Chatapp!
                </AlertDialogHeader>

                <AlertDialogBody>
                Please input your username:
                </AlertDialogBody>

                <AlertDialogFooter>
                <Input 
                onKeyDown={(e)=>
                    e.key==='Enter'&&
                    handleKeyDown(websocket,e.target.value)
                }/>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}

function ChatMessage({name,text,isSelf}){
    return (
        <div className={isSelf?"chat-message right":"chat-message left"}>
            <div className="chat-name">{name}</div>
            <div className={isSelf?"chat-bubble self":"chat-bubble others"}>{text}</div>
        </div>
    )
}

function SystemMessage({text}){
    return (
        <div className="system-message">
            {text}
        </div>
    )
}

function Conversation({convo}){
    return (
        <div>
            <div>{convo["name"]}</div>
        </div>
    )
    //TODO create divs for each conversation
    //2. onclick add to 
}


function Chat({messageWindow}){
    return (
        <div className="text-messages">
        {messageWindow && messageWindow.map((msg,index)=>
            msg.serverMessage?
            <SystemMessage key={index} text={msg.serverMessage}/>:
            <ChatMessage key={index} name={msg.name} text={msg.text} isSelf={msg.isSelf}/>
        )}
        </div>
    )
}

export default function ChatApp() {

    // const [websocket, setWebsocket] = useState();
    const [messages, setMessages] = useState({"public":{"name":"Public","messageList":[]}});
    const [loading, setLoading] = useState(false);
    const [focusId,setWindowFocus] = useState('public');
    const userName = useRef();
    const myConnectionId= useRef();
    const messageRef=useRef();
    const websocket = useRef();

    useEffect(()=>{
        websocket.current=new WebSocket(WEBSOCKET_URL);

        websocket.current.onopen = function () {
            console.log('connected to websocket');
        };

        websocket.current.onmessage = async (evt) => {
            let data = await JSON.parse(evt.data);
            console.log(data);
            if (data.id === "server"){
                if (data.message === "set name success"){
                    userName.current=data.name;
                    myConnectionId.current=data.recipient;
                    console.log(myConnectionId.current);
                } else {
                    let newarr = messages["public"]["messageList"];
                    newarr.push({serverMessage:data.message});
                    setMessages({...messages,"public":{...messages["public"],"messageList":newarr}});
                }
            }
            else {
                if (data.id===myConnectionId.current) setLoading(false);
                const recipient= await data.recipient;
                let newarr = messages[recipient]["messageList"];
                newarr.push(
                    {name:data.name,
                    text:data.message,
                    isSelf:data.id===myConnectionId.current}
                );
                setMessages({...messages,[recipient]:{...messages[recipient],"messageList":newarr}});
            }
            console.log(Object.keys(messages).length);
        };

        websocket.current.onclose = function () {
            console.log('socket closed');
        };
    }, [])
    // useEffect(()=>console.log("main component reloaded"));

    const sendMessage=(ws,message)=>{
        if (loading) return;
        ws.current.send(JSON.stringify({"action":"sendMessage","message":message,"recipient":focusId}));
        messageRef.current.value="";
        setLoading(true);
    }

    return (
        <div className="main-container">
            <UsernamePrompt websocket={websocket}/>
            <div className="main-chat-container">
            
                <div className="side-bar">
                    <h2>Chat App</h2>
                    <div style={{'font-size':'30px'}}>{userName.current}</div>
                    {Object.keys(messages).map( (key)=>{
                        console.log("key:",key,"messagelist",messages[key])
                        return <Conversation convo={messages[key]}/>
                    })}
                </div>


                <div className="main-chat">
                    <div className="chat-window-name">
                        <div ><b style={{'font-size':'20px'}}>{messages[focusId]['name']}</b></div>
                    </div>
                    <Chat messageWindow={messages[focusId]["messageList"]}/>
                    <div className="text-inputarea">
                        <Input 
                        _placeholder={{ color: 'blue.500' }} 
                        placeholder="Type here..." 
                        color='black' 
                        variant='filled'
                        ref={messageRef}
                        onKeyDown={(e)=>e.key==='Enter'&& sendMessage(websocket,e.target.value)} 
                        /> 
                        <Button 
                        isLoading={loading}
                        color='white'
                        bg='blue' 
                        variant="outline" 
                        rightIcon={<ArrowForwardIcon />}
                        onClick={()=>sendMessage(websocket,messageRef.current.value)}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}