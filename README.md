# Chatroom App

A real-time chatroom web application built with TypeScript, Vite, and Tailwind CSS. Designed for learning, collaboration, and scalable real-time messaging.

## Features

* Real-time messaging
* Clean UI with Tailwind CSS
* Modular architecture with shared components
* TypeScript support
* Node.js backend for server-side logic and WebSocket communication
* Ready for deployment on platforms like Replit

## Project Structure

```
chatroom-main/
├── client/             # Frontend code (likely React/Vite)
├── server/             # Backend code (Node.js with WebSocket/Express)
├── shared/             # Shared utilities/types
├── package.json        # Project metadata and dependencies
├── tailwind.config.ts  # Tailwind CSS config
├── vite.config.ts      # Vite bundler config
├── tsconfig.json       # TypeScript config
└── .replit             # Replit-specific configuration
```

## Installation

```bash
git clone https://github.com/yourusername/chatroom-main.git
cd chatroom-main
npm install
```

## Running the App

### Development

```bash
npm run dev
```

Make sure both client and server are started if they are separated.

### Production Build

```bash
npm run build
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
