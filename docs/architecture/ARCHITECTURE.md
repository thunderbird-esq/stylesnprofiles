# NASA System 6 Portal - Architecture Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Context](#2-system-context)
3. [Container Architecture](#3-container-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Data Architecture](#5-data-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Quality Attributes](#7-quality-attributes)
8. [Architecture Decisions](#8-architecture-decisions)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Evolution Roadmap](#10-evolution-roadmap)

---

## 1. System Overview

### Executive Summary

The NASA System 6 Portal is a modern full-stack web application that combines nostalgic Apple System 6 aesthetics with contemporary web technologies to create an engaging educational platform for accessing NASA's space data. The system implements a secure proxy architecture to protect NASA API keys while providing users with an authentic retro computing experience.

### Business Context

**Mission**: Democratize access to NASA's extensive space data through an intuitive, nostalgic interface that bridges the gap between historical computing and modern space exploration.

**Target Users**:
- Space enthusiasts and educators
- Students interested in astronomy
- Retro computing enthusiasts
- General public interested in NASA data

**Key Business Values**:
- Educational accessibility
- Historical preservation of computing interfaces
- Data security and privacy
- Cross-platform compatibility

### System Scope

**In Scope**:
- NASA APOD (Astronomy Picture of the Day) integration
- Near Earth Object (NEO) tracking data
- Resource saving and search history
- Authentic System 6 desktop interface
- Responsive design for modern devices

**Out of Scope**:
- Real-time space mission tracking
- User authentication and profiles (Phase 2)
- Social features and sharing
- Mobile native applications

---

## 2. System Context

### System Landscape Diagram

```mermaid
graph TB
    subgraph "External Systems"
        NASA[NASA APIs]
        NASA_APOD[APOD Service]
        NASA_NEWS[NeoWS Service]
        NASA_MARS[Mars Rover API]
    end

    subgraph "NASA System 6 Portal"
        subgraph "Frontend"
            UI[React Frontend<br/>System 6 Interface]
            APPS[NASA Applications]
        end

        subgraph "Backend"
            API[Express.js API Server]
            PROXY[NASA API Proxy]
            DB_LAYER[Database Layer]
        end

        subgraph "Data Store"
            POSTGRES[(PostgreSQL<br/>Primary Database)]
        end
    end

    subgraph "Users"
        USER[Space Enthusiasts<br/>Educators<br/>Students]
    end

    USER --> UI
    UI --> API
    API --> PROXY
    PROXY --> NASA_APOD
    PROXY --> NASA_NEWS
    API --> DB_LAYER
    DB_LAYER --> POSTGRES
```

### System Boundaries and Interfaces

| Boundary | Interface | Protocol | Purpose |
|----------|-----------|----------|---------|
| User → Frontend | Web Browser | HTTPS | User interaction and display |
| Frontend → Backend | REST API | HTTP/HTTPS | Data requests and responses |
| Backend → NASA | REST API | HTTPS | External data retrieval |
| Backend → Database | SQL | TCP/IP | Data persistence |
| Backend → Frontend | WebSocket | WS | Real-time updates (future) |

### Data Flow Overview

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant NASA
    participant Database

    User->>Frontend: Request APOD data
    Frontend->>Backend: GET /api/nasa/planetary/apod
    Backend->>NASA: Proxy request with API key
    NASA->>Backend: APOD data response
    Backend->>Database: Cache/save if requested
    Backend->>Frontend: Formatted response
    Frontend->>User: Display in System 6 window
```

---

## 3. Container Architecture

### Application Containers

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Web Container"
            NGINX[Nginx<br/>Static File Server]
            REACT[React Build<br/>SPA]
        end

        subgraph "API Container"
            EXPRESS[Express.js Server<br/>Port 3001]
            PROXY[NASA API Proxy<br/>Rate Limited]
            DB_POOL[Database Connection Pool]
        end

        subgraph "Database Container"
            POSTGRES_DOCKER[(PostgreSQL<br/>Database)]
        end
    end

    NGINX --> EXPRESS
    EXPRESS --> DB_POOL
    DB_POOL --> POSTGRES_DOCKER
    EXPRESS --> PROXY
```

### Container Specifications

#### Frontend Container (Nginx + React)
- **Purpose**: Serve static React application
- **Technology**: Nginx alpine, static HTML/CSS/JS
- **Port**: 80/443 (HTTP/HTTPS)
- **Resources**: Minimal CPU, 256MB RAM
- **Scaling**: Horizontal scaling via load balancer

#### Backend Container (Node.js)
- **Purpose**: API server and NASA proxy
- **Technology**: Node.js 18+, Express.js
- **Port**: 3001 (internal)
- **Resources**: 1 CPU core, 512MB RAM
- **Scaling**: Horizontal with sticky sessions

#### Database Container (PostgreSQL)
- **Purpose**: Data persistence and caching
- **Technology**: PostgreSQL 14+
- **Port**: 5432 (internal)
- **Resources**: 2 CPU cores, 2GB RAM
- **Scaling**: Primary-replica configuration

### Service Dependencies

```mermaid
graph LR
    subgraph "Frontend Services"
        UI[React UI]
        STATE[State Management]
        NAV[Navigation]
    end

    subgraph "Backend Services"
        API[API Gateway]
        AUTH[Auth Service]
        CACHE[Cache Service]
        NASA_PROXY[NASA Proxy]
    end

    subgraph "Data Services"
        USER_DATA[User Data]
        NASA_DATA[NASA Cache]
        SEARCH_DATA[Search History]
    end

    UI --> API
    STATE --> API
    NAV --> API
    API --> AUTH
    API --> CACHE
    API --> NASA_PROXY
    AUTH --> USER_DATA
    CACHE --> NASA_DATA
    CACHE --> SEARCH_DATA
```

---

## 4. Component Architecture

### Frontend Component Hierarchy

```
App
├── AppContext (Global State Provider)
├── Desktop (Main Desktop Interface)
│   ├── MenuBar (System Menu Bar)
│   ├── DesktopIcon (Application Launchers)
│   │   ├── ApodIcon
│   │   ├── NeoWsIcon
│   │   └── ResourceNavigatorIcon
│   └── WindowManager (Window Management)
│       ├── Window (Generic Window Container)
│       │   ├── ApodApp (Astronomy Picture of Day)
│       │   ├── NeoWsApp (Near Earth Objects)
│       │   └── ResourceNavigatorApp (Saved Resources)
│       └── FocusManager (Window Focus Handling)
```

### Component Responsibilities

#### Core System Components

**Desktop**
- Renders main System 6 desktop interface
- Manages window z-index stacking
- Handles background image and system colors
- Coordinates with MenuBar for system events

**Window**
- Implements draggable window functionality
- Manages window state (open/closed/minimized)
- Handles title bar interactions (close, minimize)
- Provides window focus management

**MenuBar**
- Renders Apple-style menu bar
- Handles system-level menu actions
- Coordinates with Desktop for application menus
- Provides keyboard shortcuts and hotkeys

#### Application Components

**ApodApp**
- Fetches and displays NASA Astronomy Picture of the Day
- Handles date navigation and image viewing
- Implements save/bookmark functionality
- Provides detailed explanations and metadata

**NeoWsApp**
- Displays Near Earth Object tracking data
- Filters objects by approach distance and date
- Visualizes orbital information and threat levels
- Provides educational content about asteroids/comets

**ResourceNavigatorApp**
- Manages saved NASA resources and bookmarks
- Provides search and filter capabilities
- Handles personal collection organization
- Implements resource categorization and tagging

### State Management Architecture

```typescript
interface AppState {
  windows: Window[];
  activeWindowId: string | null;
  nextZIndex: number;
  apps: AppDefinition[];
}

interface Window {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isOpen: boolean;
  isMinimized: boolean;
  data: any; // App-specific data
}
```

### Component Communication Patterns

1. **Props Drilling**: Parent to child data flow
2. **Context API**: Global state sharing
3. **Event Bubbling**: Child to parent communication
4. **Custom Hooks**: Shared logic encapsulation

---

## 5. Data Architecture

### Data Model Overview

```mermaid
erDiagram
    SAVED_ITEMS {
        string id PK
        string type
        string title
        string url
        string category
        text description
        timestamp saved_at
    }

    SAVED_SEARCHES {
        int id PK
        string query_string
        timestamp search_time
    }

    NASA_CACHE {
        string cache_key PK
        json data
        timestamp expires_at
        string endpoint
    }

    USER_DATA {
        string user_id PK
        json preferences
        timestamp created_at
        timestamp updated_at
    }

    SAVED_ITEMS ||--o{ USER_DATA : belongs_to
    SAVED_SEARCHES ||--o{ USER_DATA : belongs_to
```

### Database Schema

#### Primary Tables

**saved_items**
```sql
CREATE TABLE saved_items (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES user_data(user_id),
    type TEXT NOT NULL CHECK (type IN ('apod', 'neo', 'mars', 'epic')),
    title TEXT NOT NULL,
    url TEXT,
    category TEXT,
    description TEXT,
    metadata JSONB,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_type ON saved_items(type);
CREATE INDEX idx_saved_items_saved_at ON saved_items(saved_at);
```

**saved_searches**
```sql
CREATE TABLE saved_searches (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES user_data(user_id),
    query_string TEXT NOT NULL,
    search_type TEXT,
    results_count INTEGER,
    search_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_searches_time ON saved_searches(search_time);
```

**nasa_cache**
```sql
CREATE TABLE nasa_cache (
    cache_key TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_expires ON nasa_cache(expires_at);
CREATE INDEX idx_cache_endpoint ON nasa_cache(endpoint);
```

### Data Flow Patterns

#### NASA API Data Flow
```mermaid
graph LR
    REQUEST[API Request] --> CHECK{Check Cache}
    CHECK -->|Hit| CACHE_RETURN[Return Cached Data]
    CHECK -->|Miss| NASA_CALL[Call NASA API]
    NASA_CALL --> STORE[Cache Response]
    STORE --> CLIENT_RETURN[Return to Client]
    CACHE_RETURN --> CLIENT_RETURN
```

#### User Data Flow
```mermaid
graph TB
    USER_ACTION[User Action] --> VALIDATE[Input Validation]
    VALIDATE --> SANITIZE[Data Sanitization]
    SANITIZE --> DATABASE[Database Operation]
    DATABASE --> AUDIT[Audit Logging]
    AUDIT --> RESPONSE[Response to Client]
```

### Data Persistence Strategy

1. **Cache Layer**: NASA API responses cached for performance
2. **User Data**: Persistent storage of saved items and preferences
3. **Session Data**: Temporary in-memory state for active sessions
4. **Audit Logs**: Comprehensive logging for security and analytics

---

## 6. Security Architecture

### Threat Model

```mermaid
graph TB
    subgraph "External Threats"
        DDOS[DDoS Attacks]
        INJECTION[SQL Injection]
        XSS[Cross-Site Scripting]
        CSRF[Cross-Site Request Forgery]
        ABUSE[API Abuse]
    end

    subgraph "Security Controls"
        RATE[Rate Limiting]
        VALIDATION[Input Validation]
        SANITIZE[Output Sanitization]
        CSRF_TOKEN[CSRF Tokens]
        HEIMDALL[API Key Protection]
    end

    subgraph "Security Measures"
        HELMET[Helmet.js Headers]
        CORS[CORS Configuration]
        ENCRYPTION[Data Encryption]
        MONITORING[Security Monitoring]
        AUDIT[Audit Logging]
    end

    DDOS --> RATE
    INJECTION --> VALIDATION
    XSS --> SANITIZE
    CSRF --> CSRF_TOKEN
    ABUSE --> HEIMDALL

    RATE --> MONITORING
    VALIDATION --> AUDIT
    SANITIZE --> HELMET
    CSRF_TOKEN --> CORS
    HEIMDALL --> ENCRYPTION
```

### Security Controls Implementation

#### Frontend Security
- **Content Security Policy**: Restricts resource loading
- **XSS Protection**: React's built-in HTML escaping
- **Input Validation**: PropTypes and runtime validation
- **Secure Communication**: HTTPS-only API calls
- **Authentication**: JWT-based stateless authentication (planned)

#### Backend Security
- **API Key Protection**: Server-side NASA API key management
- **Rate Limiting**: 50 requests per 15 minutes per IP
- **Input Sanitization**: Express-validator with XSS protection
- **SQL Injection Prevention**: Parameterized queries only
- **Security Headers**: Helmet.js comprehensive header protection

#### Data Security
- **Encryption**: Data at rest encrypted (PostgreSQL)
- **API Key Rotation**: Automated NASA API key rotation
- **Audit Logging**: Comprehensive access logging
- **Backup Security**: Encrypted database backups
- **Privacy Compliance**: GDPR-aligned data handling

### Security Monitoring

1. **Real-time Monitoring**: WAF and intrusion detection
2. **Log Analysis**: Automated security log processing
3. **Vulnerability Scanning**: Regular dependency security audits
4. **Penetration Testing**: Quarterly security assessments
5. **Incident Response**: Documented security incident procedures

---

## 7. Quality Attributes

### Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 3 seconds | Web Vitals LCP |
| API Response Time | < 2 seconds | Server response time |
| Time to Interactive | < 5 seconds | Web Vitals TTI |
| Database Query Time | < 100ms | Query execution time |
| Cache Hit Rate | > 80% | Cache effectiveness |

### Scalability Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Load Balancer]
    end

    subgraph "Frontend Cluster"
        FE1[Frontend Instance 1]
        FE2[Frontend Instance 2]
        FE3[Frontend Instance N]
    end

    subgraph "Backend Cluster"
        BE1[Backend Instance 1]
        BE2[Backend Instance 2]
        BE3[Backend Instance N]
    end

    subgraph "Database Cluster"
        DB_MASTER[(PostgreSQL Master)]
        DB_REPLICA1[(PostgreSQL Replica 1)]
        DB_REPLICA2[(PostgreSQL Replica 2)]
    end

    LB --> FE1
    LB --> FE2
    LB --> FE3
    FE1 --> BE1
    FE2 --> BE2
    FE3 --> BE3
    BE1 --> DB_MASTER
    BE2 --> DB_MASTER
    BE3 --> DB_MASTER
    BE1 --> DB_REPLICA1
    BE2 --> DB_REPLICA2
```

### Reliability Requirements

- **Uptime**: 99.5% availability target
- **Error Rate**: < 1% API error rate
- **Data Consistency**: Strong consistency for user data
- **Backup Recovery**: < 4 hour recovery time objective
- **Disaster Recovery**: Geographic redundancy for critical services

### Maintainability

#### Code Quality Standards
- **Code Coverage**: > 80% test coverage
- **Technical Debt**: Automated technical debt tracking
- **Code Reviews**: Mandatory peer review process
- **Documentation**: Comprehensive inline documentation
- **Standards**: ESLint + Prettier code formatting

#### Deployment Architecture
- **CI/CD Pipeline**: Automated testing and deployment
- **Blue-Green Deployments**: Zero-downtime deployments
- **Rollback Strategy**: Instant rollback capability
- **Environment Parity**: Development/Staging/Production consistency
- **Monitoring**: Comprehensive application monitoring

---

## 8. Architecture Decisions

### Key Architectural Decisions (ADRs)

#### ADR-001: React with System.css Framework
**Status**: Accepted
**Date**: 2024-01-15
**Decision**: Use React 18 with System.css for authentic System 6 UI

**Context**: Need to balance modern web development capabilities with authentic retro aesthetics.

**Decision**: React provides modern component architecture while System.css delivers authentic System 6 styling.

**Consequences**: Modern tooling with retro interface, good developer experience, limited retro UI options.

#### ADR-002: NASA API Proxy Architecture
**Status**: Accepted
**Date**: 2024-01-20
**Decision**: Implement server-side NASA API proxy for security

**Context**: NASA API keys must be protected, rate limiting required, caching needed for performance.

**Decision**: Express.js server proxies all NASA API calls, adding authentication and caching layer.

**Consequences**: Enhanced security, centralized rate limiting, additional infrastructure complexity.

#### ADR-003: PostgreSQL for Data Persistence
**Status**: Accepted
**Date**: 2024-01-25
**Decision**: Use PostgreSQL as primary database

**Context**: Need reliable ACID-compliant database for user data and caching.

**Decision**: PostgreSQL provides robust data integrity, JSON support for metadata, proven reliability.

**Consequences**: Strong consistency, ACID compliance, horizontal scaling challenges.

#### ADR-004: State Management with React Context
**Status**: Accepted
**Date**: 2024-02-01
**Decision**: Use React Context API for global state management

**Context**: Window management and global state required without excessive complexity.

**Decision**: React Context provides adequate state management for current complexity level.

**Consequences**: Simpler implementation, potential performance issues with larger state.

#### ADR-005: Component-Based Architecture
**Status**: Accepted
**Date**: 2024-02-05
**Decision**: Modular component architecture for NASA applications

**Context**: Need to support multiple NASA data services with consistent UI patterns.

**Decision**: Each NASA service implemented as independent React component with standard interfaces.

**Consequences**: Easy extension with new services, consistent user experience, potential code duplication.

### Decision Records Structure

Each ADR follows the MADR (Markdown Architecture Decision Record) format:
- **Title**: Clear, descriptive title
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: Background and problem statement
- **Decision**: The chosen approach
- **Consequences**: Positive and negative impacts
- **Alternatives**: Other considered options

---

## 9. Deployment Architecture

### Production Architecture

```mermaid
graph TB
    subgraph "CDN/Edge"
        CLOUDFLARE[Cloudflare CDN]
        DNS[DNS Provider]
    end

    subgraph "Load Balancer"
        ALB[Application Load Balancer]
        SSL[SSL Certificate]
    end

    subgraph "Web Tier"
        NGINX1[Nginx 1]
        NGINX2[Nginx 2]
        REACT1[React App 1]
        REACT2[React App 2]
    end

    subgraph "API Tier"
        EXPRESS1[Express 1]
        EXPRESS2[Express 2]
        EXPRESS3[Express 3]
    end

    subgraph "Data Tier"
        POSTGRES_MASTER[(PostgreSQL Master)]
        POSTGRES_REPLICA[(PostgreSQL Replica)]
        REDIS[(Redis Cache)]
    end

    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ELASTICSEARCH[Elasticsearch]
    end

    CLOUDFLARE --> DNS
    DNS --> ALB
    ALB --> SSL
    SSL --> NGINX1
    SSL --> NGINX2
    NGINX1 --> REACT1
    NGINX2 --> REACT2
    REACT1 --> EXPRESS1
    REACT2 --> EXPRESS2
    EXPRESS1 --> EXPRESS3
    EXPRESS1 --> POSTGRES_MASTER
    EXPRESS2 --> POSTGRES_REPLICA
    EXPRESS3 --> REDIS
    EXPRESS1 --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    EXPRESS1 --> ELASTICSEARCH
```

### Infrastructure as Code

#### Docker Compose Configuration
```yaml
version: '3.8'
services:
  frontend:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/nasa_system6
      - NASA_API_KEY=${NASA_API_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=nasa_system6
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### CI/CD Pipeline

```yaml
# GitHub Actions Workflow
name: Build and Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint
      - name: Type check
        run: npm run typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: docker-compose build
      - name: Push to registry
        run: docker-compose push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: ./deploy.sh
```

### Environment Configuration

#### Development Environment
- **Local Development**: Docker Compose
- **Database**: Local PostgreSQL instance
- **API Key**: Development NASA API key
- **Monitoring**: Local development tools

#### Staging Environment
- **Infrastructure**: Cloud-based staging environment
- **Database**: Staging PostgreSQL replica
- **API Key**: Staging NASA API key
- **Testing**: Integration and end-to-end tests

#### Production Environment
- **Infrastructure**: Cloud provider (AWS/Azure/GCP)
- **Database**: Managed PostgreSQL with replication
- **API Key**: Production NASA API key with monitoring
- **Monitoring**: Full observability stack

---

## 10. Evolution Roadmap

### Phase 1: Foundation (Current)
**Timeline**: Q1 2024 - Q2 2024
**Status**: In Progress

**Completed**:
- ✅ System.css integration
- ✅ React application architecture
- ✅ NASA API proxy implementation
- ✅ Basic window management system
- ✅ PostgreSQL database setup
- ✅ Testing infrastructure

**In Progress**:
- 🔄 Database migration completion
- 🔄 Integration testing
- 🔄 Performance optimization

### Phase 2: Enhanced Features
**Timeline**: Q3 2024 - Q4 2024

**Planned Features**:
- 🔲 User authentication system
- 🔲 Personal dashboard and profiles
- 🔲 Advanced search and filtering
- 🔲 Data export capabilities
- 🔲 Mobile responsiveness improvements
- 🔲 Enhanced error handling

**Technical Improvements**:
- 🔲 Redux Toolkit for state management
- 🔲 Advanced caching strategies
- 🔲 API rate limiting optimization
- 🔲 Real-time data updates with WebSockets

### Phase 3: Platform Expansion
**Timeline**: Q1 2025 - Q2 2025

**Planned Features**:
- 🔲 Multi-language support
- 🔲 Educational content integration
- 🔲 Community features and sharing
- 🔲 Advanced analytics dashboard
- 🔲 Mobile application development

**Technical Evolution**:
- 🔲 Microservices architecture
- 🔲 Event-driven architecture
- 🔲 Advanced monitoring and observability
- 🔲 Machine learning integration

### Phase 4: Advanced Platform
**Timeline**: H2 2025

**Vision**:
- 🔲 AI-powered content recommendations
- 🔲 Virtual reality space exploration
- 🔲 Advanced data visualization
- 🔲 Global scale deployment
- 🔲 Educational institution partnerships

---

## Documentation Maintenance

### Documentation Standards

- **Review Cycle**: Monthly architecture review
- **Update Process**: Automated documentation generation
- **Version Control**: Architecture documentation versioned with code
- **Accessibility**: Documentation available to all team members
- **Tools**: Markdown with Mermaid diagrams for visualizations

### Responsibility Matrix

| Role | Documentation Responsibility |
|------|----------------------------|
| Tech Lead | Architecture overview and decisions |
| Backend Dev | API documentation and database schemas |
| Frontend Dev | Component documentation and user flows |
| DevOps | Infrastructure and deployment documentation |
| QA | Testing documentation and quality metrics |

### Change Management

Architecture changes must follow this process:
1. **Proposal**: Create ADR for proposed changes
2. **Review**: Technical review by architecture team
3. **Approval**: Stakeholder approval for significant changes
4. **Implementation**: Implement according to approved design
5. **Documentation**: Update all relevant documentation
6. **Communication**: Inform team of architectural changes

---

*This architecture documentation is maintained as part of the NASA System 6 Portal project. For questions or contributions, please refer to the project repository.*