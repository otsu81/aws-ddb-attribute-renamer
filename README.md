# DynamoDB attribute renamer

Since AWS DynamoDB doesn't have a schema, renaming a column isn't really possible. That means you need to go through all items in the table and rename the attribute on each.

This script makes it possible. From my laptop it runs approx. 65,000 250 byte items per minute for an on-demand table, but there's room for tweaking, especially if you have higher numbers of provisioned IOPS configured for your table.

Example command:

```bash
node js/renamer.js --table [table name] --region [aws region] --old_attribute [attribute name] --new_attribute [attribute name] --delete_old_attribute [true|false]
```