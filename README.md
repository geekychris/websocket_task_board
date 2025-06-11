# Sticky Board - Project Management Board Application

A real-time collaborative project management board application inspired by Trello, built with Spring Boot and React.

## Features

- Dynamic board layout with customizable columns
- Draggable post-it notes with rich content support
- Real-time updates across multiple users
- Attachment support (images, PDFs, text files, markdown)
- Color-coded post-it notes
- Persistent storage of board state

## Technology Stack

### Backend

- **Spring Boot 3.2.3**: Core framework for the backend service
- **Java 21**: Programming language
- **PostgreSQL**: Database for persistent storage
- **Spring Data JPA**: Data access and ORM
- **WebSocket**: Real-time communication
- **Project Lombok**: Reduces boilerplate code

### Frontend

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: React component library for consistent styling
- **@dnd-kit**: Drag and drop functionality
- **STOMP.js**: WebSocket client
- **Axios**: HTTP client
- **Vite**: Build tool and development server

## Architecture

### Backend Design

The backend follows a layered architecture:

1. **Controller Layer**: Handles HTTP requests and WebSocket messages
   - `BoardController`: REST endpoints for board operations
   - WebSocket endpoints for real-time updates

2. **Model Layer**: Domain entities
   - `Board`: Represents the main board
   - `Column`: Represents a column in the board
   - `PostIt`: Represents a post-it note
   - `Attachment`: Represents file attachments

3. **Repository Layer**: Data access
   - Uses Spring Data JPA for database operations

### Frontend Design

The frontend follows a component-based architecture:

1. **Components**:
   - `Board`: Main container component
   - `Column`: Manages a list of post-its
   - `PostIt`: Individual post-it note with drag functionality

2. **State Management**:
   - React hooks for local state
   - WebSocket for real-time updates

3. **Real-time Updates**:
   - WebSocket connection maintains sync between clients
   - Updates are broadcast to all connected clients

## Database Schema

```sql
Board
- id (PK)
- title

Column
- id (PK)
- board_id (FK)
- title
- position

PostIt
- id (PK)
- column_id (FK)
- title
- description
- owner
- color
- position

Attachment
- id (PK)
- post_it_id (FK)
- filename
- content_type
- path
```

## Setup and Installation

### Prerequisites

- Java 21 or later
- Node.js 18 or later
- PostgreSQL 13 or later
- npm or yarn

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE stickyboard;
```

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd sticky_board
```

2. Configure database connection in `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/stickyboard
    username: your_username
    password: your_password
```

3. Build and run the backend:
```bash
./gradlew bootRun
```

The backend service will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`

## API Endpoints

### REST Endpoints

- `GET /api/board/{id}`: Get board by ID
- `POST /api/board`: Create new board
- `PUT /api/board/{id}`: Update board

### WebSocket Topics

- `/topic/board`: Receives board updates
- `/app/board`: Sends board updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## To Be Done

### Backend Tasks

1. **Move and Reorder Operations**
   - Implement full support for moving post-its between columns
   - Add reordering functionality within columns
   - Ensure WebSocket events properly propagate these changes

2. **Attachment System**
   - Complete file upload endpoint implementation
   - Add file storage service (local or cloud-based)
   - Implement attachment retrieval endpoints
   - Add attachment deletion functionality

3. **Security**
   - Implement user authentication
   - Add authorization for board access
   - Secure WebSocket connections
   - Add user session management

4. **Error Handling**
   - Implement comprehensive error handling
   - Add validation for all input data
   - Create custom exception types
   - Add proper error responses

### Frontend Tasks

1. **UI Enhancements**
   - Improve drag and drop visual feedback
   - Add loading states and animations
   - Implement responsive design for mobile
   - Add themes and customization options

2. **Feature Implementation**
   - Complete attachment upload UI
   - Add post-it color selection
   - Implement post-it search and filtering
   - Add column management UI (add, edit, delete)

3. **State Management**
   - Improve WebSocket reconnection handling
   - Add offline support with local storage
   - Implement optimistic updates
   - Add conflict resolution for concurrent edits

4. **Testing**
   - Add unit tests for components
   - Implement integration tests
   - Add end-to-end testing
   - Set up continuous integration
