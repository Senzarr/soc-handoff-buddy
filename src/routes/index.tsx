import { createFileRoute, HeadContent } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel Log — SOC Shift Handoff" },
      {
        name: "description",
        content:
          "A simple shift handoff log for SOC teams. Record incidents, actions, and follow-ups for the next watch.",
      },
      { property: "og:title", content: "Sentinel Log — SOC Shift Handoff" },
      {
        property: "og:description",
        content:
          "A simple shift handoff log for SOC teams. Record incidents, actions, and follow-ups for the next watch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type EntryStatus = "follow-up" | "resolved";

interface HandoffEntry {
  id: string;
  operator: string;
  ticketId: string;
  incident: string;
  action: string;
  followup: string;
  status: EntryStatus;
  createdAt: string;
}

const STORAGE_KEY = "soc-handoff-entries";

const initialEntries: HandoffEntry[] = [
  {
    id: "1",
    operator: "A. Chen",
    ticketId: "IDX-8841-A",
    incident:
      "Observed multiple failed login attempts on DB-SRV-04 followed by successful access using a service account. Traffic originated from a non-standard subnet (10.4.x.x).",
    action: "Account locked, forensic snapshot initiated.",
    followup: "Verify service account permissions and audit log rotation.",
    status: "follow-up",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "2",
    operator: "S. Varma",
    ticketId: "MAINT-442",
    incident:
      "Standard security patches applied to the external firewall cluster. Post-patch health check successful across all nodes.",
    action: "Patches verified and rolled out to all cluster nodes.",
    followup: "None required. Automated reports scheduled for weekly review.",
    status: "resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

function Index() {
  const [entries, setEntries] = useState<HandoffEntry[]>(initialEntries);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(new Date());

  const [operator, setOperator] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [incident, setIncident] = useState("");
  const [action, setAction] = useState("");
  const [followup, setFollowup] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HandoffEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, loaded]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator.trim() || !incident.trim()) return;

    const newEntry: HandoffEntry = {
      id: crypto.randomUUID(),
      operator: operator.trim(),
      ticketId: ticketId.trim() || "—",
      incident: incident.trim(),
      action: action.trim() || "None recorded.",
      followup: followup.trim() || "None.",
      status: "follow-up",
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setOperator("");
    setTicketId("");
    setIncident("");
    setAction("");
    setFollowup("");
  };

  const toggleStatus = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: entry.status === "follow-up" ? "resolved" : "follow-up" } : entry,
      ),
    );
  };

  const handleClear = () => {
    if (confirm("Clear all handoff entries? This cannot be undone.")) {
      setEntries([]);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <HeadContent />

      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display text-xl uppercase tracking-tighter">Sentinel<span className="text-accent">/</span>Log</span>
          <div className="h-4 w-px bg-border" />
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase hidden sm:inline">
            SOC Operations // Shift Handoff
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] uppercase font-medium">Live Feed</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <section className="animate-in">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-wider cursor-blink">New Shift Entry</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{format(now, "HH:mm:ss")} UTC</span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card ring-1 ring-black/5 rounded-xl p-6 shadow-sm mb-16"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label htmlFor="operator" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
                  Operator
                </label>
                <input
                  id="operator"
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="J. Miller"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground/40"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ticket" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
                  Ticket / Alert ID
                </label>
                <input
                  id="ticket"
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="IDX-9022-B"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="incident" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
                  Incident Summary
                </label>
                <textarea
                  id="incident"
                  rows={3}
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  placeholder="Summary of the incident or observation..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none placeholder:text-muted-foreground/40"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="action" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
                    Action Taken
                  </label>
                  <input
                    id="action"
                    type="text"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    placeholder="Isolated endpoint 10.0..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="followup" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
                    Pending Follow-up
                  </label>
                  <input
                    id="followup"
                    type="text"
                    value={followup}
                    onChange={(e) => setFollowup(e.target.value)}
                    placeholder="Legal review required..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-widest rounded-md hover:bg-accent transition-colors active:translate-y-px duration-200"
              >
                Commit Entry
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Shift History // {sortedEntries.length} {sortedEntries.length === 1 ? "Entry" : "Entries"}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {sortedEntries.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                No entries logged for this shift.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedEntries.map((entry, index) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onToggleStatus={() => toggleStatus(entry.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-6 left-6 z-50">
        <div className="bg-foreground text-background px-3 py-1.5 rounded-sm flex items-center gap-4 shadow-xl">
          <span className="font-mono text-[9px] tracking-widest">SYSTEM STATUS: NOMINAL</span>
          <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          {sortedEntries.length > 0 && (
            <button
              onClick={handleClear}
              className="font-mono text-[9px] tracking-widest text-background/70 hover:text-background underline underline-offset-2"
            >
              CLEAR
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function EntryCard({ entry, index, onToggleStatus }: { entry: HandoffEntry; index: number; onToggleStatus: () => void }) {
  const isResolved = entry.status === "resolved";
  const accentBar = isResolved ? "bg-primary" : "bg-accent";
  const opacity = isResolved ? "opacity-80" : "opacity-100";

  return (
    <article
      className={`animate-in group relative ${opacity}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute -left-3 top-0 bottom-0 w-1 ${accentBar} rounded-full opacity-100`} />
      <div className="bg-card ring-1 ring-black/5 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs font-medium ${isResolved ? "text-primary" : "text-accent"}`}>
                {entry.ticketId}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {format(new Date(entry.createdAt), "HH:mm 'UTC'")}
              </span>
            </div>
            <h3 className="font-display text-lg tracking-tight">{entry.incident.split(".")[0]}</h3>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-sm ${
                isResolved
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {isResolved ? "Resolved" : "Follow-Up Required"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Reported by: {entry.operator}</span>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Incident Summary</h4>
            <p className="text-sm text-foreground/80 leading-relaxed text-pretty">{entry.incident}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-border pt-4">
            <div className="space-y-2">
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Resolution Steps</h4>
              <p className="text-xs text-foreground/70">{entry.action}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Next Steps</h4>
              <p className="text-xs text-foreground/70">{entry.followup}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <button
            onClick={onToggleStatus}
            className={`text-[10px] uppercase font-semibold tracking-tighter transition-colors ${
              isResolved
                ? "text-accent hover:text-accent/80"
                : "text-primary hover:text-primary/80"
            }`}
          >
            Mark as {isResolved ? "Needs Follow-up" : "Resolved"}
          </button>
        </div>
      </div>
    </article>
  );
}
