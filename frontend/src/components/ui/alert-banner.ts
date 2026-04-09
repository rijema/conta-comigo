interface Alert {
  type: "info" | "warning" | "success";
  message: string;
}

export function AlertBanner({ alert }: { alert: Alert }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  const icons = { info: "ℹ️", warning: "⚠️", success: "✅" };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles[alert.type]}`}
      role="alert"
    >
      <span aria-hidden="true">{icons[alert.type]}</span>
      <span className="text-sm">{alert.message}</span>
    </div>
  );
}