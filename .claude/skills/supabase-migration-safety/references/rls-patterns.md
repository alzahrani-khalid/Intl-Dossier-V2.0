# RLS patterns for Intl-Dossier

## Templates

### Org-scoped (most tables)

```sql
CREATE POLICY "Users see only their org's rows"
  ON public.<table>
  FOR SELECT
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));
```

### User-scoped (personal data)

```sql
CREATE POLICY "Users see only their own rows"
  ON public.<table>
  FOR SELECT
  USING (user_id = auth.uid());
```

### Role-based (admin override)

```sql
CREATE POLICY "Admins see all"
  ON public.<table>
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## Gotchas

- **`auth.uid()` returns NULL when called from the service role.** Service-role queries bypass RLS by design; don't write policies that assume `auth.uid()` is always set.
- **Subqueries in USING clauses can be slow.** For a hot table, materialize the org/user lookup with a SECURITY DEFINER function and reference it.
- **ENABLE ROW LEVEL SECURITY before adding policies.** `CREATE TABLE` does not enable it automatically.

```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
```

- **Test by querying as the user.** Use the Supabase MCP's `execute_sql` with the user's JWT to confirm the policy actually filters.
