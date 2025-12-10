@echo off
echo Exporting database schema...
docker run --rm postgres:17 pg_dump --schema-only "postgresql://postgres.drqdxqparwtaytcvvpyo:NSaqhEENIbgqiiQS@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" > complete-schema.sql
echo Done! Schema saved to complete-schema.sql
pause
