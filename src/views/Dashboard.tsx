import { PromotionRecord, PullHistoryRecord } from "../db";

interface DashboardProps {
  stats: {
    totalPromotions: number;
    lastPulled: string;
    nextPull: string;
    dbUptime: string;
    isMockMode: boolean;
  };
  promotions: (PromotionRecord & { pulled_at: string })[];
  history: PullHistoryRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    brand: string;
    search: string;
    date: string;
  };
}

export const Dashboard = ({ stats, promotions, history, pagination, filters }: DashboardProps) => {
  const formatTime = (isoString: string) => {
    if (!isoString || isoString === "Never") return "Never";
    if (isoString === "Syncing now..." || isoString === "Checking..." || isoString === "After sync completes") return isoString;
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  const getBrandBadgeColors = (brand: string | null) => {
    if (!brand) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    const b = brand.toLowerCase();
    if (b.includes("kfc")) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (b.includes("mcdonald")) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (b.includes("burger king")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    if (b.includes("marrybrown")) return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const buildQuery = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.search) params.set("search", filters.search);
    if (filters.date) params.set("date", filters.date);
    return `/?${params.toString()}`;
  };

  return (
    <div class="space-y-12">
      {/* Stats Section with Transcript Icon */}
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div class="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col gap-3 transition-all duration-300">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Deals</span>
            <div class="p-2 bg-blue-500/10 rounded-lg"><i class="ph ph-tag text-blue-400 text-lg"></i></div>
          </div>
          <div>
            <div class="text-3xl font-heading font-bold text-white">{stats.totalPromotions}</div>
            <div class="text-sm text-slate-400 mt-1">Across entire history</div>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col gap-3 transition-all duration-300">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Last Pulled</span>
            <div class="p-2 bg-purple-500/10 rounded-lg"><i class="ph ph-clock text-purple-400 text-lg"></i></div>
          </div>
          <div>
            <div class="text-lg font-heading font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{formatTime(stats.lastPulled)}</div>
            <div class="text-sm text-slate-400 mt-1">Next: {formatTime(stats.nextPull)}</div>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col gap-3 transition-all duration-300">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Data Source</span>
            <div class="p-2 bg-emerald-500/10 rounded-lg"><i class="ph ph-database text-emerald-400 text-lg"></i></div>
          </div>
          <div>
            <div class={`text-xl font-heading font-bold ${stats.isMockMode ? "text-yellow-400" : "text-emerald-400"}`}>
              {stats.isMockMode ? "MOCK MODE" : "LIVE API"}
            </div>
            <div class="text-sm text-slate-400 mt-1">{stats.isMockMode ? "Dry-run enabled" : "Tavily integration"}</div>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col gap-3 transition-all duration-300">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Uptime</span>
            <div class="p-2 bg-cyan-500/10 rounded-lg"><i class="ph ph-activity text-cyan-400 text-lg"></i></div>
          </div>
          <div>
            <div class="text-3xl font-heading font-bold text-white">{stats.dbUptime}</div>
            <div class="text-sm text-slate-400 mt-1">Server health optimal</div>
          </div>
        </div>

        {/* Audit Transcript Action Card */}
        <button onclick="document.getElementById('logs-modal').showModal()" class="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer h-full border border-primary/30 bg-primary/5 hover:bg-primary/10">
          <div class="p-3 bg-primary/20 rounded-full group-hover:scale-110 transition-transform">
            <i class="ph-fill ph-file-text text-primary text-3xl"></i>
          </div>
          <span class="font-bold text-white font-heading">View Execution Logs</span>
          <span class="text-xs text-slate-400 text-center">Scheduler transcripts</span>
        </button>
      </section>

      {/* Promotions List */}
      <section class="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div class="flex items-center gap-3">
            <i class="ph-fill ph-fire text-orange-500 text-2xl"></i>
            <h2 class="text-2xl font-heading font-bold text-white">Promotions & News</h2>
          </div>
          
          <form method="GET" action="/" class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div class="relative flex-grow md:flex-grow-0">
              <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                name="search" 
                placeholder="Search deals..." 
                value={filters.search}
                class="w-full md:w-48 lg:w-64 bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-500"
              />
            </div>
            
            {/* Date Filter */}
            <div class="relative">
              <input 
                type="date" 
                name="date" 
                value={filters.date}
                class="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer [color-scheme:dark]"
              />
            </div>

            <select 
              name="brand" 
              class="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
            >
              <option value="" selected={!filters.brand}>All Brands</option>
              <option value="KFC" selected={filters.brand === "KFC"}>KFC</option>
              <option value="McDonald's" selected={filters.brand === "McDonald's"}>McDonald's</option>
              <option value="Burger King" selected={filters.brand === "Burger King"}>Burger King</option>
              <option value="Marrybrown" selected={filters.brand === "Marrybrown"}>Marrybrown</option>
              <option value="Pizza Hut" selected={filters.brand === "Pizza Hut"}>Pizza Hut</option>
              <option value="Domino's" selected={filters.brand === "Domino's"}>Domino's</option>
            </select>
            
            <button type="submit" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Filter
            </button>
            {(filters.brand || filters.search || filters.date) && (
              <a href="/" class="text-slate-400 hover:text-white text-sm font-medium px-2 py-2 transition-colors">
                Clear
              </a>
            )}
          </form>
        </div>
        
        {promotions.length === 0 ? (
          <div class="glass-panel rounded-3xl p-16 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-700">
            <i class="ph ph-magnifying-glass text-6xl text-slate-600 mb-4"></i>
            <h3 class="text-xl font-bold text-slate-300">No Promotions Found</h3>
            <p class="text-slate-500 mt-2">Try adjusting your filters or wait for the scheduler to pull more deals.</p>
          </div>
        ) : (
          <>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <a href={promo.url} target="_blank" rel="noopener noreferrer" class="group block h-full">
                  <div class="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col h-full relative overflow-hidden transition-all duration-300">
                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:from-primary/20 transition-all duration-500"></div>
                    
                    <div class="flex justify-between items-start mb-4 relative z-10">
                      <span class={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-full ${getBrandBadgeColors(promo.brand)}`}>
                        {promo.brand || "Promotion"}
                      </span>
                      <div class="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-900/40 px-2.5 py-1 rounded-md border border-white/5">
                        <i class="ph ph-calendar-blank"></i>
                        {formatTime(promo.pulled_at).split(',')[0]}
                      </div>
                    </div>
                    
                    <div class="flex-grow relative z-10">
                      <h3 class="text-lg font-bold text-white mb-3 leading-tight group-hover:text-primary transition-colors duration-200 line-clamp-2">
                        {promo.title}
                      </h3>
                      <p class="text-sm text-slate-400 line-clamp-4 leading-relaxed">
                        {promo.content}
                      </p>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center relative z-10">
                      <span class="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <i class="ph ph-link"></i> Read More
                      </span>
                      <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <i class="ph ph-arrow-up-right text-sm"></i>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div class="mt-8 flex justify-center items-center gap-4">
                {pagination.page > 1 ? (
                  <a 
                    href={buildQuery(pagination.page - 1)}
                    class="px-4 py-2 glass-panel rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <i class="ph ph-caret-left"></i> Previous
                  </a>
                ) : (
                  <button disabled class="px-4 py-2 glass-panel opacity-50 cursor-not-allowed rounded-lg text-sm font-medium text-slate-500 flex items-center gap-2">
                    <i class="ph ph-caret-left"></i> Previous
                  </button>
                )}
                
                <span class="text-sm font-medium text-slate-400">
                  Page <span class="text-white font-bold">{pagination.page}</span> of <span class="text-white font-bold">{pagination.totalPages}</span>
                </span>

                {pagination.page < pagination.totalPages ? (
                  <a 
                    href={buildQuery(pagination.page + 1)}
                    class="px-4 py-2 glass-panel rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    Next <i class="ph ph-caret-right"></i>
                  </a>
                ) : (
                  <button disabled class="px-4 py-2 glass-panel opacity-50 cursor-not-allowed rounded-lg text-sm font-medium text-slate-500 flex items-center gap-2">
                    Next <i class="ph ph-caret-right"></i>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Execution Logs Modal */}
      <dialog id="logs-modal" class="bg-transparent m-auto p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm shadow-2xl rounded-3xl w-full max-w-4xl opacity-0 transition-[opacity,transform] duration-300 [&[open]]:opacity-100 [&[open]]:scale-100 scale-95" onclick="if(event.target === this) this.close()">
        <div class="glass-panel !bg-slate-900 border border-slate-700 w-full overflow-hidden flex flex-col max-h-[85vh]">
          <div class="flex justify-between items-center p-6 border-b border-white/10 bg-slate-800/50">
            <div class="flex items-center gap-3">
              <i class="ph-fill ph-file-text text-primary text-2xl"></i>
              <h2 class="text-xl font-heading font-bold text-white">Execution Transcripts</h2>
            </div>
            <button onclick="document.getElementById('logs-modal').close()" class="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
              <i class="ph ph-x"></i>
            </button>
          </div>
          
          <div class="overflow-y-auto p-6 bg-black/20">
            {history.length === 0 ? (
              <div class="p-12 text-center text-slate-500">
                <i class="ph ph-clipboard-text text-4xl mb-3 opacity-50"></i>
                <p>No execution transcripts recorded yet.</p>
              </div>
            ) : (
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr class="text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                    <th class="px-4 py-3">Timestamp</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3 text-center">Found</th>
                    <th class="px-4 py-3">Speed</th>
                    <th class="px-4 py-3 w-full">Transcript Message</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-slate-300">
                  {history.map((log) => (
                    <tr key={log.id} class="hover:bg-white/[0.02] transition-colors">
                      <td class="px-4 py-3 font-mono text-slate-400 text-xs">
                        {formatTime(log.pulled_at || "")}
                      </td>
                      <td class="px-4 py-3">
                        <span class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                          log.status === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.status === 'success' ? <i class="ph-fill ph-check-circle"></i> : <i class="ph-fill ph-x-circle"></i>}
                          {log.status}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center font-bold text-white">
                        {log.results_count}
                      </td>
                      <td class="px-4 py-3 text-slate-400">
                        {log.duration_ms}ms
                      </td>
                      <td class="px-4 py-3">
                        {log.error_message ? (
                          <span class="text-red-400 font-mono text-xs max-w-xs block truncate" title={log.error_message}>
                            {log.error_message}
                          </span>
                        ) : (
                          <span class="text-slate-500 text-xs flex items-center gap-1">
                            <i class="ph ph-check"></i> Scheduler completed cycle
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Helper script to animate dialog open/close */}
        <script dangerouslySetInnerHTML={{ __html: `
          const dialog = document.getElementById('logs-modal');
          // No special JS needed since we use CSS transitions and native .showModal()
        `}} />
      </dialog>
    </div>
  );
};
