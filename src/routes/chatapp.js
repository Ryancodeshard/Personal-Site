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

export default function ChatApp() {

    // const [websocket, setWebsocket] = useState();
    const [publicMessageList, setPublicMessageList] = useState([]);
    const [loading, setLoading] = useState(false);
    const userName = useRef();
    const myConnectionId= useRef();
    const messageRef=useRef();
    const websocket = useRef();

    useEffect(()=>{
        // setWebsocket(websocket);
        websocket.current=new WebSocket(WEBSOCKET_URL);

        websocket.current.onopen = function () {
            console.log('connected to websocket');
        };

        websocket.current.onmessage = async (evt) => {
            console.log(evt.data);
            let data = await JSON.parse(evt.data);
            if (data.type === "update"){
                if (data.message === "set name success"){
                    userName.current=data.name;
                    myConnectionId.current=data.id;
                } else setPublicMessageList((prevArray)=>[...prevArray,
                        {serverMessage:data.message}
                    ])
            }
            else if (data.type === "public"){
                console.log(myConnectionId.current);
                if (data.id===myConnectionId.current) setLoading(false);
                setPublicMessageList((prevArray)=>[...prevArray,
                    {name:data.name,
                    text:data.message,
                    isSelf:data.id===myConnectionId.current}
                ]);
            }

            // if (data["privateMessage"]){
            // 	console.log(data["privateMessage"])
            // 	data["privateMessage"].forEach(d=>console.log(d));
            // 	setLocationData(prevlocationdata => ({state:"connected",data:data["privateMessage"]}));
            // }
        };

        websocket.current.onclose = function () {
            console.log('socket closed');
            // setLocationData({"state":"disconnected","data":[]});
        };
    }, [])

    const sendMessage=(ws,message)=>{
        if (loading) return;
        ws.current.send(JSON.stringify({"action":"sendPublic","message":message}));
        messageRef.current.value="";
        setLoading(true);

    }

    return (
        <div className="main-container">
            <UsernamePrompt websocket={websocket}/>
            <div className="main-chat-container">
            
                <div className="side-bar">
                    <h2>Chat App</h2>
                    <div>{userName.current}</div>
                </div>
                <div className="main-chat">
                    <div className="text-messages">
                        <ChatMessage name="Vishnu" text="Hello" isSelf={false}/>
                        <ChatMessage name="Vishnu" text="Anyone there?" isSelf={false}/>
                        {publicMessageList.map((msg,index)=>
                        msg.serverMessage?
                        <SystemMessage key={index} text={msg.serverMessage}/>:
                        <ChatMessage key={index} name={msg.name} text={msg.text} isSelf={msg.isSelf}/>
                        )}
                        
                    </div>
                    <div className="text-inputarea">
                        <Input 
                        _placeholder={{ color: 'blue.500' }} 
                        placeholder="Type here..." 
                        color='black' 
                        variant='filled'
                        ref={messageRef}
                        onKeyDown={(e)=>e.key==='Enter'&& sendMessage(websocket,e.target.value)} 
                        /> 
                         {/*TODO 
                         1.when enter pressed should trigger loading on button 
                         */}
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