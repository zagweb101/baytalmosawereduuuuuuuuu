import { getAuditLogs } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AuditLogsPage() {
  const logs = await getAuditLogs(100);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">سجل التدقيق</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">التاريخ</th>
              <th className="text-start p-3">المستخدم</th>
              <th className="text-start p-3">الإجراء</th>
              <th className="text-start p-3">النوع</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border">
                <td className="p-3">{formatDate(log.createdAt)}</td>
                <td className="p-3">{log.user?.name ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3">{log.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
