# GASTAT International Dossier System Constitution

**Version 2.1.1**  
**Effective Date:** September 2025  
**Document ID:** GASTAT-ID-CONST-001

---

## Preamble

This constitution establishes the fundamental principles, architectural guidelines, and operational standards for the GASTAT International Dossier System. It serves as the foundational framework ensuring consistency, quality, and alignment with GASTAT's strategic objectives in international cooperation and statistical excellence.

---

## Article I: Core Principles

### 1.1 AI-First Architecture

- **Principle**: Every feature and capability must be designed with AI integration as a primary consideration, not an afterthought
- **Implementation**: Local LLM deployment using AnythingLLM, with fallback mechanisms for AI service unavailability
- **Standards**: Minimum 70B parameter models for complex tasks, with specialized smaller models for specific functions
- **Compliance**: All AI interactions must be logged, auditable, and comply with Saudi data sovereignty requirements

### 1.2 Container-First Deployment

- **Principle**: All system components must be containerized and deployable via Docker Compose
- **Implementation**: Single-command deployment using `docker-compose up`, with health checks for all services
- **Standards**: All services must include health endpoints (`/health`) and graceful shutdown handling
- **Compliance**: Container images must be scanned for vulnerabilities and updated regularly

### 1.3 Bilingual Excellence

- **Principle**: Arabic and English must be treated as first-class languages throughout the system
- **Implementation**: RTL/LTR layout support, proper Unicode handling, and cultural context awareness
- **Standards**: All user-facing content must be available in both languages with professional translation
- **Compliance**: WCAG 2.1 Level AA accessibility standards for both language directions

### 1.4 Data Sovereignty

- **Principle**: All data must remain within Saudi Arabia's borders and comply with local regulations
- **Implementation**: On-premises or Saudi-hosted cloud infrastructure only, with data residency controls
- **Standards**: Encryption at rest and in transit, with Saudi-approved cryptographic standards
- **Compliance**: NCA and SDAIA regulatory compliance for all data handling

---

## Article II: Architectural Standards

### 2.1 Technology Stack Constitution

**Frontend Stack (Mandatory)**:

- **React 19+** with TypeScript for type safety and modern development practices
- **Vite** for build tooling and development server
- **TanStack Router** for type-safe, file-based routing
- **TanStack Query** for server state management and caching
- **TanStack Table** for advanced data tables and analytics
- **Tailwind CSS + shadcn/ui** for consistent design system
- **React Native/Expo** for mobile applications

**Backend Stack (Mandatory)**:

- **Supabase (Self-hosted)** for database, authentication, and real-time features
- **PostgreSQL** with pgvector extension for AI embeddings
- **Node.js with TypeScript** for additional services
- **Redis** for caching and session management
- **Express.js** for API development

**AI/ML Stack (Mandatory)**:

- **AnythingLLM** as primary LLM orchestration platform
- **BGE-M3 or multilingual-e5** for Arabic/English embeddings
- **Ollama** for additional local model deployment
- **LangGraph** for complex agent workflows (when needed)

**Infrastructure Stack (Mandatory)**:

- **Docker + Docker Compose** for containerization
- **Caddy** for reverse proxy and automatic HTTPS
- **MinIO** for S3-compatible object storage (if needed beyond Supabase)

### 2.2 Prohibited Technologies

- **Next.js**: Use Vite + React instead for simpler self-hosting
- **Kubernetes**: Use Docker Compose for sufficient scale and simpler operations
- **External AI APIs**: Use local LLM deployment only (except for specific translation services)
- **Non-containerized deployments**: All services must run in containers
- **Third-party authentication**: Use Supabase Auth or local authentication only

### 2.3 Integration Standards

- **API-First Design**: All functionality must be accessible via RESTful APIs
- **GraphQL Support**: Provide GraphQL endpoints for flexible data queries
- **Webhook Support**: Implement webhooks for event notifications
- **Rate Limiting**: 100 requests per minute per user for API access
- **Backwards Compatibility**: Maintain compatibility for 2 major versions

---

## Article III: Functional Requirements

### 3.1 Core Dossier Management

- **Comprehensive Entity Support**: Countries, Organizations, Forums/Conferences, Thematic Areas
- **AI-Generated Summaries**: Automatic executive summary generation and updates
- **Version Control**: Complete audit trail and rollback capability for all documents
- **Advanced Search**: Full-text search with faceted filtering and AI-powered semantic search
- **Bulk Operations**: Import/export capabilities for CSV, Excel, and JSON formats

### 3.2 Relationship Intelligence

- **Health Scoring**: 0-100 relationship health scores based on engagement metrics
- **Risk Assessment**: Automated risk identification and alerting
- **Next Best Actions**: AI-powered recommendations for relationship improvement
- **Contact Management**: Comprehensive contact database with expertise mapping
- **Communication Logging**: Automatic categorization and sentiment analysis

### 3.3 Commitment Tracking

- **MoU Lifecycle Management**: Complete tracking from initiation to expiration
- **Deliverable Monitoring**: Status tracking with automated alerts
- **Performance Metrics**: Completion rates, delays, and impact assessment
- **Digital Signatures**: Support for DocuSign and local PKI signatures
- **Financial Tracking**: Budget allocation and utilization monitoring

### 3.4 Event Management

- **Comprehensive Calendar**: International events with categorization and priority
- **Delegation Management**: Composition, approval workflows, and resource allocation
- **Brief Generation**: AI-powered pre-event briefs with context awareness
- **Action Item Tracking**: Capture, assignment, and escalation workflows
- **ROI Measurement**: Cost tracking and outcome assessment

### 3.5 Intelligence & Foresight

- **Automated Scanning**: Daily monitoring of configured intelligence sources
- **Trend Identification**: NLP analysis for emerging statistical practices
- **Competitive Intelligence**: Benchmarking against peer NSOs
- **Predictive Analytics**: Relationship outcome predictions
- **Customized Digests**: Role-based intelligence summaries

---

## Article IV: Performance Standards

### 4.1 Response Time Requirements

- **Page Load**: < 2 seconds for 90% of requests
- **Search Results**: < 500ms for simple queries, < 1s for faceted, < 3s for semantic
- **AI Brief Generation**: < 30 seconds for 95% of requests
- **Real-time Updates**: < 100ms latency for live features
- **Bulk Operations**: < 1 minute per 1000 records

### 4.2 Availability Standards

- **Uptime**: 99.9% during business hours (6:00 AM - 10:00 PM AST, Sunday-Thursday)
- **Recovery Time**: < 5 minutes for automatic failover
- **Backup Frequency**: Every 4 hours with point-in-time recovery
- **Graceful Degradation**: System must function when AI services are unavailable

### 4.3 Scalability Requirements

- **Concurrent Users**: Support 500 users without performance degradation
- **Data Volume**: Handle 100,000 dossier records with sub-second queries
- **Storage**: Support up to 10TB of document storage
- **AI Processing**: Process 1,000 AI requests per hour

---

## Article V: Security & Compliance

### 5.1 Authentication & Authorization

- **Multi-Factor Authentication**: Required for all users
- **Role-Based Access Control**: Principle of least privilege
- **Permission Delegation**: Temporary access with audit trails
- **Account Security**: Lock after 5 failed attempts, password complexity requirements
- **Session Management**: Secure session handling with timeout

### 5.2 Data Protection

- **Encryption**: AES-256 at rest, TLS 1.3+ in transit
- **Field-Level Encryption**: For sensitive data elements
- **Input Sanitization**: Prevent injection attacks
- **CSRF Protection**: Tokens for all state-changing operations
- **Data Classification**: Public, Internal, Confidential, Secret levels

### 5.3 Regulatory Compliance

- **Saudi NCA Standards**: Full compliance with cybersecurity requirements
- **SDAIA Regulations**: Data and AI governance compliance
- **Data Residency**: All data must remain within Saudi Arabia
- **Audit Logging**: Complete audit trail with tamper detection
- **Data Portability**: Machine-readable export formats

---

## Article VI: Quality Assurance

### 6.1 Testing Standards

- **Code Coverage**: Minimum 80% through automated testing
- **Unit Testing**: Vitest for frontend, Jest for backend
- **Integration Testing**: API and database integration tests
- **E2E Testing**: Playwright for critical user journeys
- **Accessibility Testing**: axe-playwright for WCAG compliance

### 6.2 Code Quality

- **TypeScript Strict Mode**: Mandatory for all code
- **ESLint + Prettier**: Automated code formatting and linting
- **Conventional Commits**: Standardized commit message format
- **Code Reviews**: Required for all changes
- **Documentation**: Comprehensive API and code documentation

### 6.3 Deployment Standards

- **Zero-Downtime Deployments**: Blue-green deployment strategy
- **Health Checks**: All services must have health endpoints
- **Rollback Capability**: Quick rollback to previous versions
- **Monitoring**: Comprehensive logging and error tracking
- **Performance Monitoring**: Real-time performance metrics

---

## Article VII: Mobile & Accessibility

### 7.1 Mobile Requirements

- **Native Applications**: iOS and Android with full offline capability
- **Offline Sync**: Background synchronization with conflict resolution
- **Biometric Authentication**: Face ID, Touch ID, fingerprint with PIN fallback
- **Push Notifications**: Urgent commitments, deadlines, and meeting reminders
- **Voice Commands**: 90% accuracy with visual confirmation

### 7.2 Accessibility Standards

- **WCAG 2.1 Level AA**: Full compliance for web interface
- **RTL/LTR Support**: Proper Arabic and English text direction
- **Screen Reader**: Full compatibility with assistive technologies
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Support for high contrast themes

---

## Article VIII: Data Management

### 8.1 Data Architecture

- **PostgreSQL**: Primary database with jsonb support
- **pgvector**: AI embeddings storage and similarity search
- **Object Storage**: Document attachments with CDN distribution
- **Full-Text Search**: PostgreSQL text search or Elasticsearch
- **Audit Logs**: Append-only format for compliance

### 8.2 Data Retention

- **Dossiers**: Permanent retention
- **Communications**: 5 years retention
- **Audit Logs**: 7 years per government requirements
- **Temporary Data**: 2 years with archival
- **Data Deletion**: Approved requests within 30 days

### 8.3 Data Quality

- **Validation**: Required field validation before saving
- **Duplicate Detection**: Fuzzy matching with 80%+ similarity warnings
- **Standardization**: ISO 3166 country codes, international formats
- **Quality Monitoring**: Automated data quality assessment
- **Data Lineage**: Track data sources and transformations

---

## Article IX: Integration Requirements

### 9.1 Internal GASTAT Systems

- **Active Directory**: User authentication and authorization
- **Microsoft Exchange**: Calendar and email integration
- **Document Management**: CMIS protocol integration
- **HR Systems**: Staff directory and delegation management
- **Financial Systems**: Budget tracking and expense reporting

### 9.2 External Services

- **Translation APIs**: Multilingual support
- **News APIs**: Intelligence gathering
- **Geolocation Services**: Event mapping
- **Video Conferencing**: Virtual meeting integration
- **Cloud Storage**: Backup and archival services

### 9.3 International Organization Systems

- **UN Statistics Division**: API integration
- **World Bank**: Data APIs for benchmarking
- **OECD**: Statistical platform integration
- **GCC-Stat**: Data exchange protocols
- **SDMX/DDI**: Standard statistical data exchange

---

## Article X: Development & Operations

### 10.1 Development Standards

- **Package Manager**: pnpm 10.x+ is mandatory - npm and yarn are prohibited (enforced via preinstall hook)
- **Monorepo Structure**: Turborepo for build orchestration
- **TypeScript**: Strict mode for all code
- **2-Space Indentation**: Consistent formatting
- **File Naming**: PascalCase for components, kebab-case for utilities
- **Git Workflow**: Feature branches with pull request reviews

### 10.2 Build & Deployment

- **Build Commands**: `pnpm build` for production builds
- **Type Checking**: `pnpm typecheck` for TypeScript validation
- **Linting**: `pnpm lint` for code quality
- **Testing**: `pnpm test` for unit and integration tests
- **E2E Testing**: `pnpm exec playwright test` for end-to-end testing

### 10.3 Database Management

- **Migrations**: `pnpm run db:migrate` for schema changes
- **Seeding**: `pnpm run db:seed` for initial data
- **Rollback**: `pnpm run db:rollback` for migration reversal
- **Reset**: `pnpm run db:reset` for complete database reset

### 10.4 Docker Operations

- **Development**: `pnpm run docker:up` for local development
- **Shutdown**: `pnpm run docker:down` for clean shutdown
- **Logs**: `pnpm run docker:logs` for service monitoring
- **Health Checks**: Built-in health monitoring for all services

---

## Article XI: Monitoring & Maintenance

### 11.1 Monitoring Requirements

- **Application Metrics**: Performance, errors, and usage statistics
- **Infrastructure Metrics**: CPU, memory, disk, and network usage
- **Business Metrics**: User engagement, feature adoption, and ROI
- **Security Metrics**: Authentication failures, access patterns, and threats
- **AI Metrics**: Model performance, accuracy, and response times

### 11.2 Logging Standards

- **Structured Logging**: JSON format with consistent fields
- **Log Levels**: ERROR, WARN, INFO, DEBUG with appropriate usage
- **Correlation IDs**: Track requests across services
- **Sensitive Data**: Never log passwords, tokens, or personal information
- **Retention**: 7 years for audit logs, 1 year for application logs

### 11.3 Maintenance Windows

- **Scheduled Maintenance**: Sunday 2:00 AM - 4:00 AM AST
- **Emergency Maintenance**: As needed with stakeholder notification
- **Update Schedule**: Monthly security updates, quarterly feature updates
- **Backup Verification**: Weekly backup integrity checks
- **Performance Reviews**: Monthly performance analysis and optimization

---

## Article XII: Governance & Compliance

### 12.1 Change Management

- **Constitutional Amendments**: Require stakeholder approval for changes
- **Feature Additions**: Must align with constitutional principles
- **Technology Changes**: Must maintain compatibility and performance standards
- **Security Updates**: Immediate implementation for critical vulnerabilities
- **Documentation**: All changes must be documented and communicated

### 12.2 Compliance Monitoring

- **Regular Audits**: Quarterly compliance reviews
- **Security Assessments**: Annual penetration testing
- **Performance Reviews**: Monthly performance analysis
- **User Feedback**: Continuous user satisfaction monitoring
- **Regulatory Updates**: Monitor for changes in Saudi regulations

### 12.3 Escalation Procedures

- **Security Incidents**: Immediate escalation to security team
- **Performance Issues**: Escalate if SLA violations exceed 5%
- **Data Breaches**: Immediate notification to stakeholders and authorities
- **System Outages**: Escalate if downtime exceeds 30 minutes
- **Compliance Violations**: Immediate investigation and remediation

---

## Article XIII: Success Metrics

### 13.1 Operational Metrics

- **System Uptime**: Target 99.9% during business hours
- **Response Times**: Meet all performance requirements
- **User Adoption**: Target 90% of intended users within 6 months
- **Data Quality**: Maintain 95% data accuracy
- **Security Incidents**: Zero critical security breaches

### 13.2 Business Metrics

- **Efficiency Gains**: 30% reduction in preparation time for international engagements
- **Commitment Tracking**: 100% tracking of MoU commitments and deliverables
- **Engagement Opportunities**: 30% increase in proactive opportunities identified
- **User Satisfaction**: 90% satisfaction score from department staff
- **Duplicate Reduction**: 25% reduction in duplicate efforts across departments

### 13.3 AI Performance Metrics

- **Brief Generation**: 80% acceptance rate for AI-generated briefs
- **Recommendation Relevance**: 75% user acceptance of AI recommendations
- **Translation Accuracy**: 95% accuracy for Arabic-English translation
- **Voice Recognition**: 90% accuracy for voice commands
- **Prediction Accuracy**: 70% accuracy for relationship outcome predictions

---

## Article XIV: Constitutional Amendments

### 14.1 Amendment Process

- **Proposal**: Any stakeholder may propose constitutional amendments
- **Review**: Technical and business impact assessment required
- **Approval**: Requires approval from technical lead, project manager, and department head
- **Implementation**: Changes take effect after 30-day notice period
- **Documentation**: All amendments must be documented and versioned

### 14.2 Emergency Provisions

- **Security Updates**: Immediate implementation for critical security issues
- **Regulatory Compliance**: Immediate changes required by law
- **System Stability**: Emergency changes to maintain system stability
- **Post-Implementation Review**: All emergency changes require post-implementation review
- **Stakeholder Notification**: Immediate notification of all emergency changes

---

## Article XV: Constitutional Enforcement

### 15.1 Compliance Verification

- **Automated Checks**: CI/CD pipeline must verify constitutional compliance
- **Manual Reviews**: Regular manual reviews of constitutional adherence
- **Audit Trails**: Complete audit trails for all constitutional decisions
- **Performance Monitoring**: Continuous monitoring of constitutional requirements
- **User Feedback**: Regular feedback on constitutional effectiveness

### 15.2 Violation Consequences

- **Non-Compliance**: Features violating constitution must be fixed or removed
- **Performance Violations**: SLA violations require immediate remediation
- **Security Violations**: Immediate suspension of violating components
- **Documentation Violations**: Incomplete documentation blocks deployment
- **Process Violations**: Violations of development processes require retraining

---

## Document Control

| Version | Date      | Author                | Changes                          |
| ------- | --------- | --------------------- | -------------------------------- |
| 2.1.1   | Sept 2025 | GASTAT Technical Team | Initial constitutional framework |

---

## Approval Signatures

**Technical Lead**: **********\_**********  
**Date**: **********\_**********

**Project Manager**: **********\_**********  
**Date**: **********\_**********

**Department Head**: **********\_**********  
**Date**: **********\_**********

**Legal Affairs**: **********\_**********  
**Date**: **********\_**********

---

_This constitution is effective immediately upon approval and supersedes all previous architectural and operational guidelines for the GASTAT International Dossier System._
