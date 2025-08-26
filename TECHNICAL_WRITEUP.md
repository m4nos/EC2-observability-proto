# EC2 Observability Dashboard - Technical Write-Up

## Design Decisions

**Next.js over React**: Chose Next.js 15 for its built-in API routes, eliminating the need for separate backend services in this prototype. The App Router provides clean file-based routing and server-side rendering capabilities for better performance.

**SWR for Data Fetching**: Implemented SWR over React Query for its simplicity and automatic caching/revalidation. The 60-second refresh interval balances real-time insights with API rate limits. SWR's built-in error handling and loading states reduce boilerplate code.

**Material-UI Design System**: Selected MUI for rapid prototyping with consistent, accessible components. The theme system provides cohesive typography and color schemes. Tradeoff: larger bundle size (~200KB) vs. development velocity and design consistency.

## UI Assumptions & Design Philosophy

**Target User**: Research infrastructure managers who need at-a-glance cost insights but aren't AWS experts. Prioritized visual indicators (trend icons, color-coded priorities) over dense tabular data.

**Cognitive Load Management**: Used progressive disclosure—summary cards show key metrics first, detailed breakdowns available via view toggles. Anomaly alerts surface immediately to draw attention to cost spikes.

**Research Context**: Designed dimension groupings (Team, Project, Researcher, Job Type) specifically for academic/research environments where traditional business cost centers don't apply.

## Feature Intentionally Not Built

**Real-time Cost Alerting**: Chose not to implement push notifications or email alerts for cost anomalies. While valuable for production, it would require infrastructure (queues, notification services) that adds complexity without demonstrating core data visualization capabilities. The UI-based anomaly detection provides sufficient value for this prototype's scope.

## Cost Attribution Metadata Selection

For research teams managing shared infrastructure, I selected these metadata dimensions:

**1. Research Team** - Primary organizational unit for cost allocation and budget responsibility
**2. Project** - Enables granular tracking of specific research initiatives and their computational costs  
**3. Job Type** (gpu-training, simulation, batch-processing) - Critical for capacity planning and resource optimization
**4. Priority Level** - Helps identify which workloads justify higher costs vs. candidates for optimization

**Reasoning**: Research environments differ from traditional business contexts—costs need attribution to scientific outcomes rather than profit centers. The team/project hierarchy mirrors academic funding structures, while job type classification enables technical optimization decisions. Priority metadata helps balance research impact against cost efficiency, acknowledging that breakthrough discoveries may justify premium compute costs.

The anomaly detection focuses on unusual patterns (weekend activity, cost spikes) rather than absolute thresholds, since research workloads can have legitimate irregular patterns during paper deadlines or experiment phases.
