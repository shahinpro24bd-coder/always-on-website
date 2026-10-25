import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Users, Clock, ListChecks } from 'lucide-react';
import { TeamBrand } from '@/components/team-brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminDashboard, removeAccount } from '@/lib/admin.functions';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => ({ meta: [
    { title: 'Admin Dashboard — TEAM SHAHIN' }, { name: 'description', content: 'TEAM SHAHIN account management and lead activity.' },
    { property: 'og:title', content: 'Admin Dashboard — TEAM SHAHIN' }, { property: 'og:description', content: 'Private team administration.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: AdminPage,
});

function AdminPage() {
  const load = useServerFn(adminDashboard);
  const remove = useServerFn(removeAccount);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [account, setAccount] = useState('');
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => load(), retry: false });
  const deletion = useMutation({ mutationFn: (userId: string) => remove({ data: { userId } }), onSuccess: () => { toast.success('Account removed. Leads preserved.'); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }); }, onError: (e: Error) => toast.error(e.message) });
  const data = query.data;
  return <main className="min-h-screen">
    <header className="workspace-header px-5 py-5"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><TeamBrand /><Button variant="outline" asChild><Link to="/leads"><ArrowLeft /> Leads</Link></Button></div></header>
    <div className="mx-auto max-w-7xl px-5 py-8">
      <p className="text-xs font-semibold uppercase text-primary">TEAM SHAHIN / Administration</p><h1 className="mt-2 text-3xl font-semibold">Admin dashboard</h1>
      {query.isPending ? <p className="py-12">Loading…</p> : query.isError ? <div className="py-12"><p>{query.error.message}</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : data && <>
        <div className="my-8 grid grid-cols-2 gap-6 border-y py-6"><div><Users className="mb-2 size-5 text-primary" /><p className="text-sm text-muted-foreground">Accounts</p><p className="text-3xl font-semibold">{data.accounts.length}</p></div><div><ListChecks className="mb-2 size-5 text-primary" /><p className="text-sm text-muted-foreground">New lead submissions</p><p className="text-3xl font-semibold">{data.activity.length}</p></div></div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">Accounts</h2><Input aria-label="Search accounts" className="max-w-sm" placeholder="Search email…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="py-3">Account</th><th>Added leads</th><th>Last submission</th><th /></tr></thead><tbody>{data.accounts.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map(u => { const submissions = data.activity.filter(a => a.user_id === u.id); return <tr key={u.id} className="border-b"><td className="py-4 pr-4"><button className="text-primary hover:underline" onClick={() => setAccount(u.id)}>{u.email}</button></td><td>{submissions.length}</td><td className="whitespace-nowrap pr-4">{submissions[0] ? new Date(submissions[0].added_at).toLocaleString() : '—'}</td><td><Button title="Remove account" aria-label={`Remove ${u.email}`} variant="ghost" size="icon" disabled={u.id === data.selfId || deletion.isPending} onClick={() => { if (window.confirm(`Remove ${u.email}? Their leads and history will be preserved.`)) deletion.mutate(u.id); }}><Trash2 className="size-4 text-destructive" /></Button></td></tr>; })}</tbody></table></div>
        <div className="mb-4 mt-10 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-semibold"><Clock className="size-5" /> Submission history</h2>{account && <Button variant="ghost" onClick={() => setAccount('')}>All accounts</Button>}</div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="py-3">Account</th><th>Date & time</th><th>Leads</th></tr></thead><tbody>{data.activity.filter(a => !account || a.user_id === account).map(a => <tr key={a.id} className="border-b"><td className="py-3 pr-4">{data.accounts.find(u => u.id === a.user_id)?.email ?? 'Removed account'}</td><td className="whitespace-nowrap">{new Date(a.added_at).toLocaleString()}</td><td>1</td></tr>)}</tbody></table>{data.activity.length === 0 && <p className="py-8 text-muted-foreground">No new submissions yet.</p>}</div>
      </>}
    </div>
  </main>;
}