import React, { useState } from "react";
import { ScannedItem, ResaleStatus } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import {
  Search,
  Trash2,
  ExternalLink,
  Download,
  Sparkles,
  Camera,
  Layers,
  DollarSign,
  Calendar,
  CheckCircle,
  Tag,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Plus,
  Archive
} from "lucide-react";

interface InventoryTabProps {
  items: ScannedItem[];
  onDeleteItem: (id: string) => void;
  onUpdateItem?: (updatedItem: ScannedItem) => void;
  onLoadSampleItem?: () => void;
  onInspectDossier?: (item: ScannedItem) => void;
  onStartScan?: () => void;
}

export default function InventoryTab({
  items,
  onDeleteItem,
  onUpdateItem,
  onLoadSampleItem,
  onInspectDossier,
  onStartScan,
}: InventoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterNiche, setFilterNiche] = useState<string>("all");

  // Export inventory spreadsheet as CSV
  const handleExportCSV = () => {
    if (items.length === 0) return;

    const headers = [
      "Item ID",
      "Identified Name",
      "Resale Status",
      "Verdict",
      "Category",
      "Buy Price ($)",
      "Target/Sold Price ($)",
      "Net Profit ($)",
      "Platform",
      "Date Acquired",
      "Date Sold",
      "Comp Low ($)",
      "Comp High ($)",
    ];

    const rows = items.map((item) => {
      const v = item.verdict;
      const buyP = item.buyPrice ?? item.condition.askingPrice ?? 0;
      const targetP = item.soldPrice ?? v?.suggestedListingPrice ?? v?.marketRange?.median ?? 0;
      const netP = item.soldPrice
        ? item.soldPrice - buyP - item.soldPrice * 0.15
        : v?.netEstimate?.estimatedNetProfit ?? 0;

      return [
        `"${item.id}"`,
        `"${(v?.identifiedName || "Unidentified Item").replace(/"/g, '""')}"`,
        `"${item.resaleStatus || "sourced"}"`,
        `"${v?.verdict || "UNKNOWN"}"`,
        `"${(v?.category || "General").replace(/"/g, '""')}"`,
        buyP,
        targetP,
        netP,
        `"${item.platformListed || "eBay"}"`,
        `"${item.dateAcquired || item.scannedAt.slice(0, 10)}"`,
        `"${item.dateSold || ""}"`,
        v?.marketRange?.low || v?.lowValue || 0,
        v?.marketRange?.high || v?.highValue || 0,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FlipFindr_Sourcing_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick status updater
  const handleStatusChange = (item: ScannedItem, newStatus: ResaleStatus) => {
    if (!onUpdateItem) return;
    const isArchived = newStatus === "archived";
    const updated: ScannedItem = {
      ...item,
      resaleStatus: newStatus,
      isArchived,
      archiveReason: isArchived ? (item.archiveReason || "Personal Collection") : undefined,
      archivedAt: isArchived ? (item.archivedAt || new Date().toISOString()) : undefined,
      dateAcquired:
        newStatus === "sourced" || newStatus === "listed" || newStatus === "sold"
          ? item.dateAcquired || new Date().toISOString()
          : undefined,
      dateSold: newStatus === "sold" ? item.dateSold || new Date().toISOString() : undefined,
    };
    onUpdateItem(updated);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const nameMatches = item.verdict?.identifiedName
      ? item.verdict.identifiedName.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const currentStatus = (item.isArchived || item.resaleStatus === "archived")
      ? "archived"
      : (item.resaleStatus || (item.verdict?.verdict === "BUY" ? "sourced" : "passed"));
    const statusMatches = filterStatus === "all" || currentStatus === filterStatus;
    const nicheMatches = filterNiche === "all" || item.nicheId === filterNiche;

    return nameMatches && statusMatches && nicheMatches;
  });

  // Calculate Ledger aggregates
  const totalSourced = items.filter(
    (i) => !i.isArchived && (i.resaleStatus || (i.verdict?.verdict === "BUY" ? "sourced" : "passed")) !== "passed" && i.resaleStatus !== "archived"
  ).length;

  const totalArchived = items.filter(
    (i) => i.isArchived || i.resaleStatus === "archived"
  ).length;

  const totalSold = items.filter((i) => i.resaleStatus === "sold").length;

  const totalRealizedProfit = items
    .filter((i) => i.resaleStatus === "sold" && i.soldPrice)
    .reduce((sum, i) => {
      const buyP = i.buyPrice || 0;
      const soldP = i.soldPrice || 0;
      const fees = soldP * 0.15 + 7; // ~15% fees + ship
      return sum + (soldP - buyP - fees);
    }, 0);

  const totalProjectedNet = items.reduce((sum, i) => {
    return sum + (i.verdict?.netEstimate?.estimatedNetProfit || 0);
  }, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Sourcing Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Items Logged
          </span>
          <span className="text-xl font-bold font-mono text-stone-100">{items.length}</span>
        </div>

        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Active Inventory
          </span>
          <span className="text-xl font-bold font-mono text-amber-400">{totalSourced} items</span>
        </div>

        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Realized Profit
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            ${Math.round(totalRealizedProfit)}
          </span>
        </div>

        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Projected Pipeline Net
          </span>
          <span className="text-xl font-bold font-mono text-cyan-400">
            ${Math.round(totalProjectedNet)}
          </span>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search items by name, maker, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "all", label: "All" },
            { id: "sourced", label: "Sourced" },
            { id: "listed", label: "Listed" },
            { id: "sold", label: "Sold" },
            { id: "passed", label: "Passed" },
            { id: "archived", label: "Archived" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st.id
                  ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* CSV Export Button */}
        {items.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold flex items-center gap-1.5 border border-stone-700 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 bg-stone-900 border border-stone-800 rounded-3xl text-center space-y-3">
          <Layers className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-stone-200 font-display">No Sourced Items Found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {items.length === 0
              ? "Your ledger is empty. Scan an item in the field to evaluate its comps, or load our test sample."
              : "No items match your current filter parameters."}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {onStartScan && (
              <button
                onClick={onStartScan}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start New Scan</span>
              </button>
            )}
            {onLoadSampleItem && items.length === 0 && (
              <button
                onClick={onLoadSampleItem}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono font-medium text-xs border border-stone-700 cursor-pointer"
              >
                Load Sample Pyrex Item
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const v = item.verdict;
            const status = item.resaleStatus || (v?.verdict === "BUY" ? "sourced" : "passed");
            const buyP = item.buyPrice ?? item.condition.askingPrice ?? 0;
            const targetP = item.soldPrice ?? v?.suggestedListingPrice ?? v?.marketRange?.median ?? 0;
            const netProfit = v?.netEstimate?.estimatedNetProfit ?? (targetP - buyP - targetP * 0.16);

            return (
              <div
                key={item.id}
                className="p-4 bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Photo and Title */}
                <div
                  className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                  onClick={() => onInspectDossier && onInspectDossier(item)}
                >
                  <div className="w-16 h-16 rounded-xl bg-stone-950 border border-stone-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={v?.identifiedName || "Scanned item"}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                          item.isArchived || status === "archived"
                            ? "bg-purple-950/90 text-purple-300 border-purple-800 flex items-center gap-1"
                            : status === "sold"
                            ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                            : status === "listed"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : status === "sourced"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-stone-800 text-stone-400 border-stone-700"
                        }`}
                      >
                        {item.isArchived || status === "archived" ? (
                          <>
                            <Archive className="w-3 h-3 text-purple-400" />
                            <span>Archived {item.archiveReason ? `(${item.archiveReason})` : ""}</span>
                          </>
                        ) : (
                          status
                        )}
                      </span>

                      {/* Verdict Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          v?.verdict === "BUY"
                            ? "text-emerald-400"
                            : v?.verdict === "SKIP"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {v?.verdict || "APPRAISED"}
                      </span>

                      <span className="text-[10px] font-mono text-stone-500">
                        {new Date(item.scannedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold font-display text-stone-100 truncate hover:text-amber-400 transition-colors">
                      {v?.identifiedName || "Unidentified Resale Item"}
                    </h4>

                    <div className="flex items-center gap-3 text-xs font-mono text-stone-400 mt-1">
                      {buyP > 0 && <span>Buy: ${buyP}</span>}
                      <span>Target: ${targetP}</span>
                      <span className={netProfit > 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>
                        Est. Net: ${Math.round(netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Switcher & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <select
                    value={item.isArchived || status === "archived" ? "archived" : status}
                    onChange={(e) => handleStatusChange(item, e.target.value as ResaleStatus)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-mono focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="sourced">Sourced</option>
                    <option value="listed">Listed</option>
                    <option value="sold">Sold</option>
                    <option value="passed">Passed</option>
                    <option value="archived">Archived (Vault)</option>
                  </select>

                  <button
                    onClick={() => onInspectDossier && onInspectDossier(item)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete item from ledger"
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer border border-stone-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
