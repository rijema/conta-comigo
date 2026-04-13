"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SessionRecord {
  id: string;
  date: string;
  duration: number;
  skillCode: string;
  accuracy: number;
  status: "completed" | "abandoned";
}

interface SessionHistoryTableProps {
  sessions: SessionRecord[];
  isLoading?: boolean;
}

export function SessionHistoryTable({ sessions, isLoading }: SessionHistoryTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando histórico...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nenhuma sessão registrada</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Habilidade</TableHead>
            <TableHead>Acurácia</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{new Date(session.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{Math.round(session.duration / 60)}min</TableCell>
              <TableCell>{session.skillCode}</TableCell>
              <TableCell>{(session.accuracy * 100).toFixed(0)}%</TableCell>
              <TableCell>
                <span className={session.status === "completed" ? "text-green-600" : "text-yellow-600"}>
                  {session.status === "completed" ? "Concluída" : "Abandonada"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
