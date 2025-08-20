import { Edit, Grid, List, Trash } from "lucide-react";
import React, { useState } from "react";

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
}: TableViewProps<T>) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">(defaultViewMode);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  if (viewMode === "grid") {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <div
              key={String(item[idField])}
              onClick={() => onSelect && onSelect(item)}
              className={`p-4 text-left border ${
                selectedItemId === String(item[idField])
                  ? "border-white bg-zinc-800/50"
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
              <tr
                key={String(item[idField])}
                onClick={() => onSelect && onSelect(item)}
                className={`cursor-pointer transition-colors ${
                  selectedItemId === String(item[idField])
                    ? "bg-zinc-800/50"
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
