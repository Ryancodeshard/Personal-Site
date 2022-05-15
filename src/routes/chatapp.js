import "../css/chatapp.css"
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Input, useDisclosure } from '@chakra-ui/react'
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";

function UsernamePrompt({websocket,setName}){
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(()=>{
        onOpen();
    },[onOpen])

    setName("MOTHER THERESA");
    const handleKeyDown = (websocket,name) => {
        // setName(name);
        websocket.send(JSON.stringify({"action":"setName","name":name}));
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
    const [userName, setName] = useState();
    var myConnectionId;
    const messageRef=useRef();
    let websocket=new WebSocket("wss://smvtb9ary4.execute-api.ap-southeast-1.amazonaws.com/production");
    

    useEffect(()=>{
        // setWebsocket(websocket);

        websocket.onopen = function () {
            console.log('connected to websocket');
        };

        websocket.onmessage = async (evt) => {
            console.log(evt.data);
            let data = await JSON.parse(evt.data);
            if (data.type === "update"){
                if (data.message === "set name success"){
                    console.log(userName);
                    setName("greg");
                    console.log(userName);
                    myConnectionId=data.id;
                } else setPublicMessageList((prevArray)=>[...prevArray,
                        {serverMessage:data.message}
                    ])
            }
            else if (data.type === "public"){
                console.log(myConnectionId);
                setPublicMessageList((prevArray)=>[...prevArray,
                    {name:data.name,
                    text:data.message,
                    isSelf:data.id===myConnectionId}
                ]);
            }

            // if (data["privateMessage"]){
            // 	console.log(data["privateMessage"])
            // 	data["privateMessage"].forEach(d=>console.log(d));
            // 	setLocationData(prevlocationdata => ({state:"connected",data:data["privateMessage"]}));
            // }
        };

        websocket.onclose = function () {
            console.log('socket closed');
            // setLocationData({"state":"disconnected","data":[]});
        };
    }, [])

    const sendMessage=(ws,message)=>{
        ws.send(JSON.stringify({"action":"sendPublic","message":message}));
    }

    return (
        <div className="main-container">
            <UsernamePrompt websocket={websocket} setName={setName}/>
            <div className="main-chat-container">
            
                <div className="side-bar">
                    <h2>Chat App</h2>
                    <div>fdsafdsa</div>
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
                         2.clear input when enter
                         */}
                        <Button 
                        colorScheme='blue' 
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