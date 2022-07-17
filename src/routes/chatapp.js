import "../css/chatapp.css"
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Input, useDisclosure } from '@chakra-ui/react'
import { ArrowForwardIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";
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

function ProfileInfo({isProfileOpen,setProfileOpen,profileDets,handleChatClick}){
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(()=>{
        if (isProfileOpen) {
            onOpen();
            setProfileOpen(false);
        }
    },[isProfileOpen,onOpen,setProfileOpen])

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
        >
            <AlertDialogOverlay>
            <AlertDialogContent>
                <AlertDialogHeader  fontSize='lg' fontWeight='bold'>
                User Info
                </AlertDialogHeader>

                <AlertDialogBody>
                <div className="profile-header">
                    <div className="profile-pic">
                        {Array.from(profileDets.name)[0]}
                    </div>
                    <div>
                        {profileDets.name}
                    </div>
                </div>
                {profileDets.members&&<div fontSize='lg' fontWeight='bold'>Members</div>}
                {profileDets.members&&Object.keys(profileDets.members).map((id,index)=>{
                return (
                <div className="convos" key={index} onClick={e=>{
                    handleChatClick(id,profileDets.members[id])
                    onClose();
                }}>
                    <div className="profile-pic">
                        {Array.from(profileDets.members[id])[0]}
                    </div>
                    <div>
                        {profileDets.members[id]}
                    </div>
                </div>)
                })}
                </AlertDialogBody>

                <AlertDialogFooter>
                
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}

function Conversation({id,name,handleChatClick,memberCount,focusId,setFocusId,status,deleteMessage}){
    return (
        <div className={focusId===id?"convos focused":"convos"}>
            <div className="convo-click"  onClick={e=>handleChatClick(id,name)}>
                <div className="profile-pic">{Array.from(name)[0]}</div>
                <div>{name}</div>
                {memberCount&&<div className="member-count">{memberCount+" "}online</div>}
            </div>
            {status==="offline"&&<CloseIcon className="member-count"
            onClick={e=>{
                deleteMessage(id)
                if (focusId===id)
                setFocusId('public')
            }}/>}
        </div>
    )
}


export default function ChatApp() {
    const [messages, setMessages] = useState({"public":{"membercount":0,"status":"online","name":"Public","messageList":[]}});
    const [focusId, setFocusId] = useState('public');
    const userName = useRef();
    const myConnectionId= useRef();
    const messageRef=useRef();
    const websocket = useRef(null);
    const load = useRef(false);
    const [profileOpen, setProfileOpen] = useState(false)

    function deleteMessage(id){
        const deleted = {...messages}
        delete deleted[id]
        setMessages(deleted);
    }

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
                    setMessages({...messages,"public":{...messages["public"],"members":data.members}});
                } else {
                    let newarr = messages[data.recipient]["messageList"];
                    newarr.push({serverMessage:data.message});
                    setMessages({...messages,[data.recipient]:{...messages[data.recipient],"messageList":newarr,"status":data.status?data.status:"online"}});
                }
            }
            else {
                if (data.id===myConnectionId.current) load.current=false;
                const recipient= await data.recipient===myConnectionId.current?await data.id:await data.recipient;
                if (!messages.hasOwnProperty(recipient)) messages[recipient] = {"name":data.name,"status":"online","messageList":[]}
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
        const textWindow = useRef()
        const [showArrow,setShowArrow] = useState(false)
        const lastText = useRef()

        useEffect(()=>{
            handleClick();
            messageRef.current.focus();
        },[messageWindow]);


        function handleScroll(){
            if (textWindow.current) {
                const { scrollTop, scrollHeight, clientHeight } = textWindow.current;
                if (scrollTop + clientHeight !== scrollHeight) setShowArrow(true)
                else setShowArrow(false)
            }
        }

        function handleClick(){
            lastText.current.scrollIntoView({ behavior: "smooth" });
            setShowArrow(false)
        }

        return (
            <div className="text-messages" ref={textWindow} onScroll={handleScroll}>
                {messageWindow && messageWindow.map((msg,index)=>
                    msg.serverMessage?
                    <div key={index} className="system-message">{msg.serverMessage}</div>:
                    <ChatMessage key={index} from={msg.id} name={msg.name} text={msg.text}/>
                )}
                <div ref={lastText}/>
                {showArrow&&<div className="scroll-down-arrow" onClick={handleClick}><ChevronDownIcon/></div>}
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
        return (
            <div  className={from===myConnectionId.current?"chat-message right":"chat-message left"}>
                <div onClick={e=>handleChatClick(from,name)} className="chat-name">{name}</div>
                <div className={from===myConnectionId.current?"chat-bubble self":"chat-bubble others"}>{text}</div>
            </div>
        )
    }
    
    const sendMessage=(message)=>{
        if (load.current) return;
        websocket.current.send(JSON.stringify({"action":"sendMessage","message":message,"recipient":focusId}));
        messageRef.current.value="";
        load.current = true;
        console.log(load.current)
    }
    return (
        <div className="main-container">
            <UsernamePrompt websocket={websocket}/>
            <ProfileInfo isProfileOpen={profileOpen} setProfileOpen={setProfileOpen} profileDets={messages[focusId]} handleChatClick={handleChatClick}/>
            <div className="main-chat-container">
            
                <div className="side-bar">
                    
                    <h2 className="title">Definitely Not Telegram</h2>
                    
                    <div className="username" >Welcome, {userName.current}!</div>
                    {Object.keys(messages).map( (key,index)=>{
                        return <Conversation key={index} id={key} name={messages[key].name} status={messages[key].status} deleteMessage={deleteMessage}
                        handleChatClick={handleChatClick} focusId={focusId} setFocusId={setFocusId}
                        memberCount={messages[key].members?Object.keys(messages[key].members).length:false}/>
                    })}
                </div>


                <div className="main-chat">
                    <div onClick={()=>setProfileOpen(true)} className="chat-window-name"> 
                        <b>{messages[focusId]['name']}</b>
                    </div>
                    <Chat load={load} messageWindow={messages[focusId]['messageList']}/>
                    <div className="text-inputarea">
                        <Input 
                        _placeholder={{ color: 'blue.500' }} 
                        placeholder="Type here..." 
                        color='black' 
                        variant='filled'
                        ref={messageRef}
                        onKeyDown={(e)=>e.key==='Enter'&& sendMessage(e.target.value)} 
                        /> 
                        <Button 
                        isLoading={load.current}
                        color='white'
                        bg='blue' 
                        variant="outline" 
                        rightIcon={<ArrowForwardIcon />}
                        onClick={()=>sendMessage(messageRef.current.value)}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}