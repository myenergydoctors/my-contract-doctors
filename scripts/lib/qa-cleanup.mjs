// Remove only organizations created by a disposable QA user and shared with no one else.
export async function removeDisposableAccount(admin, userId) {
  const { data: { user }, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError) return { error: userError };
  if (!user?.email || !/^(document-audit-|account-flow-|browser-process-).+@example\.invalid$/.test(user.email)) {
    return { error: new Error('Refusing cleanup of a non-QA account.') };
  }
  const { data: organizations, error: orgError } = await admin.from('organizations').select('id').eq('created_by', userId);
  if (orgError) return { error: orgError };
  for (const organization of organizations || []) {
    const { data: members, error } = await admin.from('organization_members').select('user_id').eq('organization_id', organization.id);
    if (error) return { error };
    if (members.length === 1 && members[0].user_id === userId) {
      const removed = await admin.from('organizations').delete().eq('id', organization.id).eq('created_by', userId);
      if (removed.error) return removed;
    }
  }
  return admin.auth.admin.deleteUser(userId);
}
