import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatList from './components/Chat/ChatList';
import ChatRoom from './components/Chat/ChatRoom';
import ScreenshotTool from './components/Screenshot/ScreenshotTool';

// Import Socket Provider
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <Switch>
            <Route exact path="/" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/chats" component={ChatList} />
            <Route path="/chat/:userId" component={ChatRoom} />
            <Route path="/screenshot/:chatId" component={ScreenshotTool} />
          </Switch>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;

// Add a new route for the screenshot tool
// <Route path="/screenshot/:chatId" component={ScreenshotTool} />