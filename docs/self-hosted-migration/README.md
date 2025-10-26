# Self-Hosted Supabase Migration Guide

## Overview

This documentation suite provides a complete guide for migrating the Intl-Dossier V2.0 application from Supabase Cloud to a self-hosted Supabase infrastructure.

**Migration Complexity**: Moderate
**Estimated Timeline**: 6-8 days
**Code Changes Required**: Minimal (~95% code stays unchanged)

## Why Self-Host?

- ✅ Meet organizational data sovereignty requirements
- ✅ Full control over infrastructure and data location
- ✅ Keep all Supabase features (Auth, Realtime, Storage, Edge Functions)
- ✅ Minimal application code changes (just URL/key updates)

## Current Architecture

- **Database**: PostgreSQL 17.6 on Supabase Cloud (eu-west-2)
- **Project ID**: zkrcjzdemdmwhearhfgg
- **Services**: Auth, Realtime, Storage, Edge Functions (100+)
- **Code Base**: 261 files with Supabase references

## Migration Strategy

Self-hosting the complete Supabase stack using Docker Compose maintains feature parity while meeting organizational requirements.

## Documentation Structure

### 📋 Getting Started
1. **[Setup Guide](./01-setup-guide.md)** - Infrastructure setup and Supabase deployment
2. **[Migration Checklist](./02-migration-checklist.md)** - Step-by-step migration with validation
3. **[Environment Updates](./03-environment-update-scripts.md)** - Automated code configuration changes
4. **[Monitoring & Alerting](./04-monitoring-alerting.md)** - Production operations guide

### 🛠️ Supporting Resources
- **[Scripts](./scripts/)** - Automation scripts for migration tasks
- **[Configs](./configs/)** - Example configuration files

## Quick Start

### Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker-capable server (4-8 cores, 16-32GB RAM, 500GB SSD)
- [ ] Ubuntu 22.04 LTS or similar Linux distribution
- [ ] Docker Engine 24+ and Docker Compose V2 installed
- [ ] Domain name for SSL certificates
- [ ] Backup of current Supabase Cloud database
- [ ] Access to current project credentials
- [ ] At least 2 team members available for migration

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 16GB | 32GB |
| Storage | 500GB SSD | 1TB NVMe SSD |
| Network | 100Mbps | 1Gbps |

### Estimated Effort

| Phase | Duration | Complexity |
|-------|----------|------------|
| Infrastructure Setup | 1-2 days | Low |
| Supabase Deployment | 1 day | Low |
| Database Migration | 1 day | Medium |
| Application Updates | 0.5 days | Low |
| Testing & Validation | 2-3 days | High |
| Go-Live | 0.5 days | Medium |
| **Total** | **6-8 days** | |

## Migration Phases

### Phase 1: Preparation (Day 1)
- Set up infrastructure
- Deploy self-hosted Supabase stack
- Configure SSL and networking
- Review [Setup Guide](./01-setup-guide.md)

### Phase 2: Data Migration (Day 2-3)
- Export database from Supabase Cloud
- Import to self-hosted instance
- Migrate Edge Functions
- Migrate Storage buckets
- Follow [Migration Checklist](./02-migration-checklist.md)

### Phase 3: Application Updates (Day 3-4)
- Update environment variables
- Update API URLs across codebase
- Test locally
- Use [Environment Update Scripts](./03-environment-update-scripts.md)

### Phase 4: Testing (Day 4-6)
- Run full test suite
- Test mobile app sync
- Validate all Edge Functions
- Performance benchmarking
- Security audit

### Phase 5: Go-Live (Day 7-8)
- Parallel run with production
- DNS/environment cutover
- Monitor for 24-48 hours
- Decommission cloud instance

## Key Benefits of This Approach

### ✅ Minimal Code Changes
Only environment variables and API URLs need updating. All application logic, database schemas, RLS policies, and Edge Functions remain identical.

### ✅ Feature Parity
Self-hosted Supabase provides 100% feature parity with the cloud version:
- PostgreSQL with extensions (pgvector, pg_trgm)
- Auth (OAuth, email, phone)
- Realtime subscriptions
- Storage API
- Edge Functions (Deno runtime)
- Studio admin interface

### ✅ Reduced Risk
- Parallel run capability (keep cloud active during testing)
- Easy rollback if needed
- Comprehensive validation at each step

## Important Considerations

### What Stays The Same ✅
- All 200+ database migrations
- All Row Level Security (RLS) policies
- All 100+ Edge Functions
- Auth flows and user management
- Realtime subscription logic
- Storage bucket configuration
- Application business logic

### What Changes ⚙️
- API endpoint URLs (supabase.co → your domain)
- Service URLs (auth, storage, realtime endpoints)
- API keys (anon key, service_role key)
- SSL certificates (self-managed)

### New Operational Responsibilities 📊
- Database backups and retention
- Security patches and updates
- Performance monitoring
- SSL certificate renewal
- Incident response
- Capacity planning

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | Critical | Multiple backups, dry-run first |
| Downtime during cutover | Medium | High | Parallel run, staged rollout |
| Performance degradation | Low | Medium | Load testing, resource scaling |
| Configuration errors | Medium | High | Validation scripts, peer review |
| Operational knowledge gap | Medium | Medium | Documentation, external support |

## Support Resources

### Internal Resources
- This documentation suite
- Automated scripts in `./scripts/`
- Example configurations in `./configs/`

### External Resources
- [Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting)
- [Supabase Docker Repository](https://github.com/supabase/supabase/tree/master/docker)
- [Supabase Discord Community](https://discord.supabase.com)

### Recommended External Support
- Supabase Enterprise Support (optional)
- DevOps consultant for initial setup (3-5 days)
- Database administrator for optimization

## Success Criteria

Migration is considered successful when:

- [ ] All services running stably for 7 days
- [ ] Zero data loss verified
- [ ] 100% of Edge Functions operational
- [ ] Auth system working (all providers)
- [ ] Realtime subscriptions active
- [ ] Storage upload/download functional
- [ ] Mobile app sync working
- [ ] Performance meets or exceeds cloud benchmarks
- [ ] Monitoring and alerts configured
- [ ] Backup and recovery tested
- [ ] Team trained on operations

## Getting Help

If you encounter issues during migration:

1. Check the troubleshooting sections in each guide
2. Review Supabase self-hosting documentation
3. Search Supabase Discord/GitHub issues
4. Consider engaging external DevOps support
5. Contact Supabase Enterprise Support (if subscribed)

## Next Steps

Start with the [Setup Guide](./01-setup-guide.md) to prepare your infrastructure and deploy the self-hosted Supabase stack.

---

**Last Updated**: 2025-10-22
**Target Environment**: Intl-Dossier V2.0
**Current Supabase Project**: zkrcjzdemdmwhearhfgg (eu-west-2)
