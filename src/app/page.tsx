import KPIs from "@/components/KPIs";
import InstanceTable from "@/components/InstanceTable";
import CostAttributionPanel from "@/components/CostAttribution";

export default function Home() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700 }}>EC2 Observability</h2>
      <KPIs />
      <section>
        <h3 style={{ marginBottom: 8 }}>Instance utilisation</h3>
        <InstanceTable />
      </section>
      <section>
        <h3 style={{ marginBottom: 8 }}>Cost attribution</h3>
        <CostAttributionPanel />
      </section>
      {/* <section>
        <h3 style={{ marginBottom: 8 }}>Notes</h3>
        <ul style={{ paddingLeft: 16, lineHeight: 1.6 }}>
          <li>
            UX tradeoff: prioritised at-a-glance waste indicators over dense
            columns. Details are available on row expand in a future iteration.
          </li>
          <li>
            Assumption: &quot;waste&quot; = consistently low CPU (&lt; 5% avg)
            on running instances, or stopped instances retaining storage cost.
          </li>
          <li>
            Not built: per-job attribution via tags due to setup burden; using
            Cost Explorer dimensions instead for a quick prototype.
          </li>
        </ul>
      </section> */}
    </div>
  );
}
