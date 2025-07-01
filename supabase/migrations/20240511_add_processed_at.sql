-- Create function to add processed_at column
create or replace function add_processed_at_column()
returns void
language plpgsql
security definer
as $$
begin
  -- Add processed_at column if it doesn't exist
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'pdf_documents'
    and column_name = 'processed_at'
  ) then
    alter table pdf_documents
    add column processed_at timestamp with time zone;
  end if;
end;
$$; 