-- Grant the authenticated role access to the engagement-briefs surface.
--
-- The `engagement-briefs` edge function had never been deployed, so the
-- authenticated role was never granted EXECUTE on its RPCs nor SELECT on the
-- `engagement_briefs` view. Once the function was deployed, every authenticated
-- call failed with a permission error that the function surfaced as HTTP 500
-- (list/context). These grants are idempotent and safe to re-run.

grant execute on function public.get_engagement_briefs(uuid) to authenticated;
grant execute on function public.get_engagement_brief_context(uuid) to authenticated;
grant execute on function public.link_brief_to_engagement(uuid, uuid, text) to authenticated;
grant execute on function public.unlink_brief_from_engagement(uuid, text) to authenticated;
grant select on public.engagement_briefs to authenticated;
