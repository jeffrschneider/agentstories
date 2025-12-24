Analyze incoming tickets, extract key information, categorize by type and urgency, and route to appropriate queues

## Steps

1. Parse ticket content and extract key entities (product, issue type, customer ID)
2. Query CRM for customer history and account tier
3. Run sentiment analysis to gauge urgency
4. Apply categorization rules based on content and history
5. Assign priority based on customer tier + sentiment + issue type
6. Route to appropriate queue or trigger auto-response skill

## Success Criteria

- [ ] Ticket categorized with confidence > 0.7
- [ ] Priority assigned
- [ ] Routed to queue within 30 seconds
- [ ] Customer notified of receipt

## Constraints

- **PII Protection**: Never log raw customer messages to analytics
