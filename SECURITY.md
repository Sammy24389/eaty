# Security Guidelines

## Production Checklist

### Environment Variables
- [ ] Generate a strong `NEXTAUTH_SECRET` (min 32 chars): `openssl rand -base64 32`
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Use a production PostgreSQL database (not PGLite)
- [ ] Never commit `.env` files to version control
- [ ] Rotate API keys regularly

### Database
- [ ] Use SSL for database connections (`?sslmode=require`)
- [ ] Restrict database access to application IP only
- [ ] Use separate database credentials for app vs migrations
- [ ] Enable automated backups
- [ ] Run `prisma migrate deploy` (not `dev`) in production

### Authentication
- [ ] Change default admin password immediately after first login
- [ ] Enable OTP verification for customer accounts
- [ ] Set appropriate session expiration
- [ ] Use HTTPS for all auth callbacks

### Payment Gateways
- [ ] Use live API keys (not test keys) in production
- [ ] Verify webhook signatures before processing
- [ ] Never log payment card details
- [ ] Set up webhook retry policies

### Headers & Security
- [ ] `poweredByHeader: false` is enabled (removes X-Powered-By)
- [ ] Enable Content Security Policy headers
- [ ] Set up rate limiting (already configured)
- [ ] Enable HTTPS redirect on your hosting platform

### Firebase (Push Notifications)
- [ ] Store service account JSON as environment variable, not file
- [ ] Restrict FCM API key to your app's package name
- [ ] Rotate service account keys periodically

### CORS
- [ ] Set `CORS_ORIGIN` to your production domain only
- [ ] Do not use `*` in production

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor database connection pool
- [ ] Set up uptime monitoring
- [ ] Configure alerting for failed payments

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly by contacting the project maintainers. Do not open a public issue.
