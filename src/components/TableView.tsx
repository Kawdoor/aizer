import { Edit, Grid, List, Trash } from "lucide-react";
import { Fragment, ReactNode, useEffect, useState } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface TableViewProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelect?: (item: T) => void;
  idField?: keyof T;
  defaultViewMode?: "grid" | "table";
  viewMode?: "grid" | "table";
  onViewModeChange?: (mode: "grid" | "table") => void;
  showViewToggle?: boolean;
  selectedItemId?: string | null;
  expandedIds?: string[];
  renderExpanded?: (item: T) => ReactNode;
  dragType?: string;
  onDrop?: (target: T, payload: { id: string; type: string }) => void;
  onDragStart?: (item: T) => void;
}

export const TableView = <T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  onSelect,
  idField = "id" as keyof T,
  defaultViewMode = "table",
  viewMode: controlledViewMode,
  onViewModeChange,
  showViewToggle = true,
  selectedItemId = null,
  expandedIds,
  renderExpanded,
  dragType,
  onDrop,
  onDragStart,
}: TableViewProps<T>) => {
  const [viewModeState, setViewModeState] = useState<"grid" | "table">(
    defaultViewMode as "grid" | "table"
  );
  const viewMode: "grid" | "table" = (controlledViewMode as
    | "grid"
    | "table") ?? viewModeState;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const setGridIfSmall = () => {
      const isSmall = window.innerWidth <= 640;
      if (isSmall && defaultViewMode === "table") {
        if (!controlledViewMode) setViewModeState("grid");
      }
    };
    setGridIfSmall();
    window.addEventListener("resize", setGridIfSmall);
    return () => window.removeEventListener("resize", setGridIfSmall);
  }, [defaultViewMode, controlledViewMode]);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleDragStart = (e: React.DragEvent, item: T) => {
    try {
      const payload = { id: String(item[idField]), type: dragType || "item" };
      e.dataTransfer.setData("application/x-aizer", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
      setDraggingId(String(item[idField]));

      try {
        const crt = document.createElement("div");
        crt.style.position = "absolute";
        crt.style.top = "-1000px";
        crt.style.left = "-1000px";
        crt.style.padding = "6px 10px";
        crt.style.background = "rgba(17,24,39,0.95)";
        crt.style.color = "white";
        crt.style.borderRadius = "6px";
        crt.style.fontSize = "12px";
        crt.style.boxShadow = "0 4px 14px rgba(0,0,0,0.4)";
        crt.textContent = String(item[idField]);
        document.body.appendChild(crt);
        e.dataTransfer.setDragImage(crt, 12, 12);
        setTimeout(() => document.body.removeChild(crt), 0);
      } catch (err) {
        // ignore
      }

      if (onDragStart) onDragStart(item);
    } catch (err) {
      // ignore
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragOverItem = (e: React.DragEvent, item: T) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(String(item[idField]));
  };

  const handleDrop = (e: React.DragEvent, target: T) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/x-aizer");
      if (!raw) return;
      const payload = JSON.parse(raw) as { id: string; type: string };
      if (onDrop) onDrop(target, payload);
    } catch (err) {
      // ignore parse errors
    } finally {
      setDraggingId(null);
      setDragOverId(null);
    }
  };

  if (viewMode === "grid") {
    return (
      <div>
        {showViewToggle && (
          <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-sm py-2 mb-4">
            <div className="flex justify-end">
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1">
                <button
                  onClick={() => {
                    if (onViewModeChange) onViewModeChange("grid");
                    else setViewModeState("grid");
                  }}
                  className={`p-1 ${
                    viewMode === "grid" ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (onViewModeChange) onViewModeChange("table");
                    else setViewModeState("table");
                  }}
                  className={`p-1 ${
                    viewMode === "table" ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <Fragment key={String(item[idField])}>
              <div
                onClick={() => onSelect && onSelect(item)}
                draggable={!!dragType}
                onDragStart={dragType ? (e) => handleDragStart(e, item) : undefined}
                onDragEnd={dragType ? () => handleDragEnd() : undefined}
                onDragOver={onDrop ? (e) => handleDragOverItem(e, item) : undefined}
                onDrop={onDrop ? (e) => handleDrop(e, item) : undefined}
                className={`p-4 text-left border ${
                  selectedItemId === String(item[idField]) ? "border-white bg-white text-black" : "border-zinc-800 hover:border-zinc-700"
                } transition-transform duration-200 ease relative group ${
                  draggingId === String(item[idField]) ? "opacity-60 scale-95" : ""
                } ${
                  dragOverId === String(item[idField]) ? "ring-2 ring-white/20 scale-105" : ""
                }`}
              >
                {(onEdit || onDelete) && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1">
                      {onEdit && (
                        <button onClick={(e) => handleActionClick(e, () => onEdit(item))} className="p-1 hover:bg-zinc-800 rounded">
                          <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={(e) => handleActionClick(e, () => onDelete(item))} className="p-1 hover:bg-zinc-800 rounded">
                          <Trash className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {columns.slice(0, 1).map((column) => (
                    <div key={String(column.key)} className="font-light">
                      {column.render ? column.render(item) : item[column.key as keyof T]}
                    </div>
                  ))}

                  {columns.slice(1).map((column) => (
                    <div key={String(column.key)} className="text-sm text-gray-500">
                      {column.render ? column.render(item) : item[column.key as keyof T]}
                    </div>
                  ))}
                </div>
              </div>

              {expandedIds && renderExpanded && expandedIds.includes(String(item[idField])) && (
                <div key={`expanded-${String(item[idField])}`} className="col-span-full p-3 border-t border-zinc-800">
                  {renderExpanded(item)}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {showViewToggle && (
        <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-sm py-2 mb-4">
          <div className="flex justify-end">
            <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1">
              <button
                onClick={() => {
                  if (onViewModeChange) onViewModeChange("grid");
                  else setViewModeState("grid");
                }}
                className={`p-1 ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (onViewModeChange) onViewModeChange("table");
                  else setViewModeState("table");
                }}
                className={`p-1 ${viewMode === "table" ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-zinc-900">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="text-left py-2 px-4 font-light text-sm text-gray-300 tracking-wider">
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="text-right py-2 px-4 w-20">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.map((item) => (
              <Fragment key={String(item[idField])}>
                <tr
                  onClick={() => onSelect && onSelect(item)}
                  draggable={!!dragType}
                  onDragStart={dragType ? (e) => handleDragStart(e as any, item) : undefined}
                  onDragOver={onDrop ? (e) => handleDragOverItem(e as any, item) : undefined}
                  onDrop={onDrop ? (e) => handleDrop(e as any, item) : undefined}
                  className={`cursor-pointer transition-colors ${selectedItemId === String(item[idField]) ? "bg-white text-black" : "hover:bg-zinc-900/50"}`}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="py-3 px-4 text-sm font-light">
                      {column.render ? column.render(item) : item[column.key as keyof T]}
                    </td>
                  ))}

                  {(onEdit || onDelete) && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {onEdit && (
                          <button onClick={(e) => handleActionClick(e, () => onEdit(item))} className="p-1 hover:bg-zinc-800 rounded" title="Edit">
                            <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => handleActionClick(e, () => onDelete(item))} className="p-1 hover:bg-zinc-800 rounded" title="Delete">
                            <Trash className="w-4 h-4 text-gray-400 hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>

                {expandedIds && renderExpanded && expandedIds.includes(String(item[idField])) && (
                  <tr className="bg-zinc-900">
                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="py-2 px-4">
                      {renderExpanded(item)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && <div className="py-8 text-center text-gray-500">No data available</div>}
    </div>
  );
};

export default TableView;
