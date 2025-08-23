import { Edit, Grid, List, Trash } from "lucide-react";
import React, { useState, useEffect } from "react";

interface TableViewProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelect?: (item: T) => void;
  idField?: keyof T;
  defaultViewMode?: "grid" | "table";
  selectedItemId?: string | null;
  expandedIds?: string[];
  renderExpanded?: (item: T) => React.ReactNode;
  // Optional drag/drop handlers. If `dragType` is provided, rows/cards become draggable and
  // will set a dataTransfer payload of { id, type } where id is the idField value.
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
  selectedItemId = null,
  expandedIds,
  renderExpanded,
  dragType,
  onDrop,
  onDragStart,
}: TableViewProps<T>) => {
  const [viewMode, setViewMode] = useState<string>(defaultViewMode as string);

  // Prefer grid view on small/mobile screens to avoid wide tables that break layout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const setGridIfSmall = () => {
      const isSmall = window.innerWidth <= 640; // tailwind 'sm' breakpoint
      if (isSmall && defaultViewMode === "table") {
        setViewMode("grid");
      }
    };

    setGridIfSmall();
    window.addEventListener("resize", setGridIfSmall);
    return () => window.removeEventListener("resize", setGridIfSmall);
  }, [defaultViewMode]);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleDragStart = (e: React.DragEvent, item: T) => {
    try {
      const payload = { id: String(item[idField]), type: dragType || "item" };
      e.dataTransfer.setData("application/x-aizer", JSON.stringify(payload));
      // allow drop effects
      e.dataTransfer.effectAllowed = "move";
      if (onDragStart) onDragStart(item);
    } catch (err) {
      // ignore
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
    }
  };

  if (viewMode === "grid") {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 ${
                (viewMode as any) === "grid"
                  ? "bg-zinc-800 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1 ${
                (viewMode as any) === "table"
                  ? "bg-zinc-800 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <React.Fragment key={String(item[idField])}>
            <div
              onClick={() => onSelect && onSelect(item)}
              draggable={!!dragType}
              onDragStart={dragType ? (e) => handleDragStart(e, item) : undefined}
              onDragOver={onDrop ? handleDragOver : undefined}
              onDrop={onDrop ? (e) => handleDrop(e, item) : undefined}
              className={`p-4 text-left border ${
                selectedItemId === String(item[idField])
                  ? "border-white bg-white text-black"
                  : "border-zinc-800 hover:border-zinc-700"
              } transition-colors relative group`}
            >
              {(onEdit || onDelete) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-1">
                    {onEdit && (
                      <button
                        onClick={(e) =>
                          handleActionClick(e, () => onEdit(item))
                        }
                        className="p-1 hover:bg-zinc-800 rounded"
                      >
                        <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) =>
                          handleActionClick(e, () => onDelete(item))
                        }
                        className="p-1 hover:bg-zinc-800 rounded"
                      >
                        <Trash className="w-4 h-4 text-gray-400 hover:text-white" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {columns.slice(0, 1).map((column) => (
                  <div key={String(column.key)} className="font-light">
                    {column.render
                      ? column.render(item)
                      : item[column.key as keyof T]}
                  </div>
                ))}
                {columns.slice(1).map((column) => (
                  <div
                    key={String(column.key)}
                    className="text-sm text-gray-500"
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key as keyof T]}
                  </div>
                ))}
              </div>
            </div>
            {/* render expanded content directly after the item when requested (grid mode) */}
            {expandedIds && renderExpanded && expandedIds.includes(String(item[idField])) && (
              <div key={`expanded-${String(item[idField])}`} className="col-span-full p-3 border-t border-zinc-800">
                {renderExpanded(item)}
              </div>
            )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 ${
              viewMode === "grid"
                ? "bg-zinc-800 text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1 ${
              viewMode === "table"
                ? "bg-zinc-800 text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-zinc-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="text-left py-2 px-4 font-light text-sm text-gray-300 tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="text-right py-2 px-4 w-20">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.map((item) => (
              <React.Fragment key={String(item[idField])}>
              <tr
                onClick={() => onSelect && onSelect(item)}
                draggable={!!dragType}
                onDragStart={dragType ? (e) => handleDragStart(e as any, item) : undefined}
                onDragOver={onDrop ? handleDragOver : undefined}
                onDrop={onDrop ? (e) => handleDrop(e as any, item) : undefined}
                className={`cursor-pointer transition-colors ${
                  selectedItemId === String(item[idField])
                    ? "bg-white text-black"
                    : "hover:bg-zinc-900/50"
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="py-3 px-4 text-sm font-light"
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key as keyof T]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {onEdit && (
                        <button
                          onClick={(e) =>
                            handleActionClick(e, () => onEdit(item))
                          }
                          className="p-1 hover:bg-zinc-800 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) =>
                            handleActionClick(e, () => onDelete(item))
                          }
                          className="p-1 hover:bg-zinc-800 rounded"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
              {expandedIds && renderExpanded && expandedIds.includes(String(item[idField])) && (
                <tr className="bg-zinc-900">
                  <td colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)} className="py-2 px-4">
                    {renderExpanded(item)}
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="py-8 text-center text-gray-500">No data available</div>
      )}
    </div>
  );
};
