import "../css/chatapp.css"
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Input, useDisclosure } from '@chakra-ui/react'
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL="wss://smvtb9ary4.execute-api.ap-southeast-1.amazonaws.com/production"; //TODO have to hide this

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


function Conversation({id,name,handleChatClick,memberCount}){
    return (
        <div className="convos" onClick={e=>handleChatClick(id,name)}>
            <div>{name}</div>
            {memberCount&&<div>{memberCount}</div>}
        </div>
    )
    //TODO create divs for each conversation
}


export default function ChatApp() {
    const [messages, setMessages] = useState({"public":{"membercount":0,"name":"Public","messageList":[]}});
    const [loading, setLoading] = useState(false);
    const [focusId,setFocusId] = useState('public');
    const userName = useRef();
    const myConnectionId= useRef();
    const messageRef=useRef();
    const websocket = useRef(null);

    useEffect(()=>{
        websocket.current=new WebSocket(WEBSOCKET_URL);
        websocket.current.onopen = function () {
            console.log('connected to websocket');
        };
        websocket.current.onclose = function () {
            console.log('socket closed');
        };
    },[])

    useEffect(()=>{
        if (!websocket.current) return;

        websocket.current.onmessage = async (evt) => {
            let data = await JSON.parse(evt.data);
            console.log(data);
            if (data.id === "server"){
                if (data.message === "set name success"){
                    userName.current=data.name;
                    myConnectionId.current=data.recipient;
                    console.log(myConnectionId.current);
                } else if (data.members){
                    setMessages({...messages,"public":{...messages["public"],"memberCount":data.members.length}});
                } else {
                    let newarr = messages["public"]["messageList"];
                    newarr.push({serverMessage:data.message});
                    setMessages({...messages,"public":{...messages["public"],"messageList":newarr}});
                }
            }
            else {
                if (data.id===myConnectionId.current) setLoading(false);
                const recipient= await data.recipient===myConnectionId.current?await data.id:await data.recipient;
                if (!messages.hasOwnProperty(recipient)) messages[recipient] = {"name":data.name,"messageList":[]}
                let newarr = messages[recipient]["messageList"];
                newarr.push(
                    {name:data.name,
                    text:data.message,
                    id:data.id}
                );
                setMessages({...messages,[recipient]:{...messages[recipient],"messageList":newarr}});
            }
            console.log(messages);
        };
    }, [messages])

    function Chat({messageWindow}){
        return (
            <div className="text-messages">
            {messageWindow && messageWindow.map((msg,index)=>
                msg.serverMessage?
                <div key={index} className="system-message">{msg.serverMessage}</div>:
                <ChatMessage key={index} from={msg.id} name={msg.name} text={msg.text}/>
            )}
            </div>
        )
    }

    function handleChatClick(from,name){
        console.log("Clicked")
        if (from===myConnectionId.current) return
        if (!messages.hasOwnProperty(from)) setMessages({...messages,[from]:{"name":name,"messageList":[]}});
        setFocusId(from);
    }
    
    function ChatMessage({from,name,text}){
        console.log("from chat:",from,"name",name)
        return (
            <div  className={from===myConnectionId.current?"chat-message right":"chat-message left"}>
                <div onClick={e=>handleChatClick(from,name)} className="chat-name">{name}</div>
                <div className={from===myConnectionId.current?"chat-bubble self":"chat-bubble others"}>{text}</div>
            </div>
        )
    }

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
                    
                    <h2 className="title">Definitely Not Telegram</h2>
                    
                    <div style={{'font-size':'30px','':''}}>{userName.current}</div>
                    {Object.keys(messages).map( (key,index)=>{
                        return <Conversation key={index} id={key} name={messages[key]['name']} handleChatClick={handleChatClick} memberCount={messages[key].memberCount?messages[key].memberCount:false}/>
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