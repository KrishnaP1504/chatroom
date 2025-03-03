# Chatroom

## Description
Chatroom is a real-time messaging application built with **React (Next.js)** on the frontend and **Node.js (Express) with WebSockets** on the backend. It enables users to send and receive messages instantly. The app also supports media sharing (images/videos) and optional sentiment analysis for text messages.

## Features
- **Real-time Messaging** using WebSockets
- **User Authentication** with JWT
- **Media Support**: Send images and videos
- **MongoDB Database** for message storage
- **Sentiment Analysis (Optional)** using Python
- **Responsive UI** built with React

## Tech Stack
- **Frontend:** Next.js (React) with WebSockets
- **Backend:** Node.js (Express) with WebSockets
- **Database:** MongoDB
- **Authentication:** JWT

## Installation & Setup

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v16 or later)
- **MongoDB** (running locally or cloud instance)
- **Git**

### Clone the Repository
```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/chatroom.git
cd chatroom
```

### Backend Setup
```sh
cd backend
npm install
npm start
```

### Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

## Usage
- Run MongoDB locally (`mongodb://localhost:27017/chatroom`) or set up an online database.
- Start both the frontend and backend.
- Open `http://localhost:3000` in the browser.
- Sign up, log in, and start chatting in real-time!

## Contributing
Feel free to submit issues or pull requests to improve the project.

## License
This project is licensed under the MIT License.

