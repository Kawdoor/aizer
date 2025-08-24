import {
  Grid,
  List,
  LogOut,
  Plus,
  Search,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGroups } from "../hooks/useGroups";
import { supabase } from "../lib/supabase";
import CreateGroupModal from "./modals/CreateGroupModal";
import CreateInventoryModal from "./modals/CreateInventoryModal";
import CreateItemModal from "./modals/CreateItemModal";
import CreateSpaceModal from "./modals/CreateSpaceModal";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import EditInventoryModal from "./modals/EditInventoryModal";
import EditItemModal from "./modals/EditItemModal";
import EditSpaceModal from "./modals/EditSpaceModal";
import GroupMembersModal from "./modals/GroupMembersModal";
import InviteUserModal from "./modals/InviteUserModal";
import ProfileModal from "./modals/ProfileModal";
import ViewItemModal from "./modals/ViewItemModal";
import NotificationsBell from "./PendingInvitations";
import { TableView } from "./TableView";
import { useToast } from "./toast/Toast";

interface Space {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

interface Inventory {
  id: string;
  name: string;
  description: string | null;
  parent_space_id: string | null;
  parent_inventory_id: string | null;
  created_at: string;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  color: string | null;
  price: number | null;
  inventory_id: string;
  created_at: string;
  measures: any | null;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { push } = useToast();
  const {
    groups,
    loading: groupsLoading,
    createGroup,
    fetchGroupMembers,
    inviteUserToGroup,
    updateMemberRole,
    removeMemberFromGroup,
    updateGroup,
    deleteGroup,
  } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{
    spaces: Space[];
    inventories: Inventory[];
    items: Item[];
    isSearching: boolean;
  }>({
    spaces: [],
    inventories: [],
    items: [],
    isSearching: false,
  });
  const [activeModal, setActiveModal] = useState<
    | "space"
    | "inventory"
    | "item"
    | "group"
    | "editSpace"
    | "editInventory"
    | "editItem"
    | "profile"
    | "members"
    | "invite"
    | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  // track selected space to show its inventories in the INVENTORIES section
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null
  );
  const [spacesViewMode, setSpacesViewMode] = useState<"grid" | "table">(
    "grid"
  );
  const [inventoriesViewMode, setInventoriesViewMode] = useState<
    "grid" | "table"
  >("grid");
  const [itemsViewMode, setItemsViewMode] = useState<"grid" | "table">("table");
  const [createInventoryParent, setCreateInventoryParent] = useState<{
    type: "space" | "inventory";
    id: string;
  } | null>(null);
  const [createItemInventoryId, setCreateItemInventoryId] = useState<
    string | null
  >(null);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const groupMenuRef = useRef<HTMLDivElement | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [spaceToEdit, setSpaceToEdit] = useState<Space | null>(null);
  const [inventoryToEdit, setInventoryToEdit] = useState<Inventory | null>(
    null
  );

  // Estado para el modal de confirmación de eliminación
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    isOpen: boolean;
  }>({
    title: "",
    message: "",
    onConfirm: async () => {},
    isOpen: false,
  });

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchData();
    }
  }, [selectedGroupId]);

  const fetchData = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
  console.log("Dashboard.fetchData: fetching data for group", selectedGroupId);
      // Fetch spaces
      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("group_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (spacesError) throw spacesError;

      // Fetch inventories
      const { data: inventoriesData, error: inventoriesError } = await supabase
        .from("inventories")
        .select("*")
        .eq("group_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (inventoriesError) throw inventoriesError;

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("group_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      setSpaces(spacesData || []);
      setInventories(inventoriesData || []);
      setItems(itemsData || []);
      console.log(
        "Dashboard.fetchData: fetched",
        (spacesData || []).length,
        "spaces",
        (inventoriesData || []).length,
        "inventories",
        (itemsData || []).length,
        "items"
      );

      // Reset search if active
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults({
          spaces: [],
          inventories: [],
          items: [],
          isSearching: false,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults({
        spaces: [],
        inventories: [],
        items: [],
        isSearching: false,
      });
      return;
    }

    const searchTermLower = term.toLowerCase();

    // Search in spaces
    const filteredSpaces = spaces.filter(
      (space) =>
        space.name.toLowerCase().includes(searchTermLower) ||
        (space.description &&
          space.description.toLowerCase().includes(searchTermLower))
    );

    // Search in inventories
    const filteredInventories = inventories.filter(
      (inventory) =>
        inventory.name.toLowerCase().includes(searchTermLower) ||
        (inventory.description &&
          inventory.description.toLowerCase().includes(searchTermLower))
    );

    // Search in items
    const filteredItems = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTermLower) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTermLower)) ||
        (item.color && item.color.toLowerCase().includes(searchTermLower)) ||
        (item.price && item.price.toString().includes(searchTermLower)) ||
        (item.quantity && item.quantity.toString().includes(searchTermLower))
    );

    setSearchResults({
      spaces: filteredSpaces,
      inventories: filteredInventories,
      items: filteredItems,
      isSearching: true,
    });
  };

  const handleCreateGroup = async (name: string) => {
    try {
      const group = await createGroup(name);
      if (group) {
        setSelectedGroupId(group.id);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
    setCreateInventoryParent(null);
    setCreateItemInventoryId(null);
  };

  const handleEntityCreated = async () => {
  console.log("Dashboard.handleEntityCreated: refetching after entity change");
    setActiveModal(null);
    setCreateInventoryParent(null);
    setCreateItemInventoryId(null);
    await fetchData();
  };

  const handleEditSpace = (space: Space) => {
    setSpaceToEdit(space);
    setActiveModal("editSpace");
  };

  const handleEditInventory = (inventory: Inventory) => {
    setInventoryToEdit(inventory);
    setActiveModal("editInventory");
  };

  const handleEditItem = (item: Item) => {
    setItemToEdit(item);
    setActiveModal("editItem");
  };

  // Override setSelectedSpace to clear search results when selecting a space
  const handleSelectSpace = (space: Space) => {
    // Select or toggle off the selected space. The INVENTORIES section
    // will show inventories for the selected space.
    if (selectedSpace?.id === space.id) {
      setSelectedSpace(null);
    } else {
      setSelectedSpace(space);
    }

    // Clear search when selecting a space
    if (searchTerm) {
      setSearchTerm("");
      setSearchResults({
        spaces: [],
        inventories: [],
        items: [],
        isSearching: false,
      });
    }
  };

  const deleteSpace = async (space: Space) => {
    try {
      const { error } = await supabase
        .from("spaces")
        .delete()
        .eq("id", space.id);
      if (error) throw error;
      await fetchData();
      if (selectedSpace?.id === space.id) {
        setSelectedSpace(null);
      }
      // toast success
      try {
        push({
          message: `Espacio "${space.name}" eliminado.`,
          type: "success",
        });
      } catch {}
    } catch (error) {
      console.error("Error deleting space:", error);
      try {
        push({
          message:
            "No se pudo eliminar el espacio. Es posible que contenga inventarios.",
          type: "error",
        });
      } catch {}
    }
  };

  const deleteInventory = async (inventory: Inventory) => {
    try {
      const { error } = await supabase
        .from("inventories")
        .delete()
        .eq("id", inventory.id);
      if (error) throw error;
      await fetchData();
      if (selectedInventory?.id === inventory.id) {
        setSelectedInventory(null);
      }
      try {
        push({
          message: `Inventario "${inventory.name}" eliminado.`,
          type: "success",
        });
      } catch {}
    } catch (error) {
      console.error("Error deleting inventory:", error);
      try {
        push({
          message:
            "No se pudo eliminar el inventario. Es posible que contenga artículos.",
          type: "error",
        });
      } catch {}
    }
  };

  const deleteItem = async (item: Item) => {
    try {
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
      await fetchData();
      try {
        push({
          message: `Artículo "${item.name}" eliminado.`,
          type: "success",
        });
      } catch {}
    } catch (error) {
      console.error("Error deleting item:", error);
      try {
        push({ message: "No se pudo eliminar el artículo.", type: "error" });
      } catch {}
    }
  };

  // --- Drag & Drop handlers ---
  const handleMoveItemToInventory = async (
    targetInventoryId: string,
    payload: { id: string; type: string }
  ) => {
    // payload.id is the item id being moved
    try {
      const { error } = await supabase
        .from("items")
        .update({ inventory_id: targetInventoryId, parent_space_id: null })
        .eq("id", payload.id);
      if (error) throw error;
      await fetchData();
      try {
        push({ message: "Item moved.", type: "success" });
      } catch {}
    } catch (err) {
      console.error("Error moving item:", err);
      try {
        push({ message: "No se pudo mover el artículo.", type: "error" });
      } catch {}
    }
  };

  const handleMoveItemToSpace = async (
    targetSpaceId: string,
    payload: { id: string; type: string }
  ) => {
    // Moving an item to a space will unassign its inventory (set inventory_id to null) and set parent_space_id
    try {
      const { error } = await supabase
        .from("items")
        .update({ inventory_id: null, parent_space_id: targetSpaceId })
        .eq("id", payload.id);
      if (error) throw error;
      await fetchData();
      try {
        push({ message: "Item moved to space.", type: "success" });
      } catch {}
    } catch (err) {
      console.error("Error moving item to space:", err);
      try {
        push({ message: "No se pudo mover el artículo.", type: "error" });
      } catch {}
    }
  };

  const handleDeleteSpace = (space: Space) => {
    setDeleteModalConfig({
      title: "Delete Space",
      message: `Are you sure you want to delete "${space.name}"? This action cannot be undone.`,
      onConfirm: () => deleteSpace(space),
      isOpen: true,
    });
  };

  const handleDeleteInventory = (inventory: Inventory) => {
    setDeleteModalConfig({
      title: "Delete Inventory",
      message: `Are you sure you want to delete "${inventory.name}"? This action cannot be undone.`,
      onConfirm: () => deleteInventory(inventory),
      isOpen: true,
    });
  };

  const handleDeleteItem = (item: Item) => {
    setDeleteModalConfig({
      title: "Delete Item",
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      onConfirm: () => deleteItem(item),
      isOpen: true,
    });
  };

  if (groupsLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-thin text-lg tracking-wider">
          LOADING...
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-thin text-white tracking-[0.3em] mb-4">
            AIZER
          </h1>
          <p className="text-gray-400 font-light text-sm tracking-wider mb-8">
            CREATE YOUR FIRST GROUP TO GET STARTED
          </p>
          <button
            onClick={() => setActiveModal("group")}
            className="bg-white text-black px-8 py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors"
          >
            CREATE GROUP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-thin tracking-[0.3em]">AIZER</h1>
              <p className="text-gray-400 text-xs font-light tracking-wider mt-1">
                {user?.email}
              </p>
            </div>

            {/* left side: app title and group controls (unchanged) */}

            <div className="flex items-center relative" ref={groupMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setGroupMenuOpen((s) => !s)}
                  className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 px-3 py-2 text-white text-sm rounded-none hover:border-white transition-colors"
                  aria-expanded={groupMenuOpen}
                  aria-haspopup="listbox"
                  title={groups.find((g) => g.id === selectedGroupId)?.name || "Select group"}
                >
                  <span className="text-sm font-light">
                    {groups.find((g) => g.id === selectedGroupId)?.name || "Select group"}
                  </span>
                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {groupMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-none shadow-lg z-50">
                    <ul role="listbox" className="max-h-60 overflow-auto">
                      {groups.map((group) => (
                        <li key={group.id}>
                          <button
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setGroupMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              selectedGroupId === group.id ? "bg-zinc-800 text-white" : "text-gray-300 hover:bg-zinc-800"
                            }`}
                          >
                            {group.name}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => {
                            setGroupMenuOpen(false);
                            setActiveModal("group");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-zinc-800"
                        >
                          + Create group
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {selectedGroupId && (
                <button
                  onClick={() => setActiveModal("members")}
                  className="ml-2 p-2 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-zinc-800 rounded"
                  title="Manage Group Members"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Removed extra '+' button next to group controls per UX request */}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search on the right side of the navbar (hidden on xs) */}
            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search spaces, inventories, items..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors w-64 sm:w-96"
              />
            </div>
            <NotificationsBell onAcceptedInvitation={fetchData} />
            <button
              onClick={() => setActiveModal("profile")}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2 border border-transparent hover:border-zinc-800 rounded-full"
              title="Profile settings"
            >
              <UserCircle className="w-5 h-5" />
            </button>

            <button
              onClick={signOut}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-light tracking-wider">
                SIGN OUT
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
  <div className="max-w-7xl mx-auto px-6 py-2">
        {/* Pending invitations are now in the header notifications bell */}

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-8">
          <div className="flex-1" />

          <div className="flex items-center space-x-4 flex-wrap">
            {/* Top '+' button removed per UX request; use per-section + buttons instead */}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          {/* Search Results */}
          {searchResults.isSearching && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-light text-white tracking-wider">
                  SEARCH RESULTS FOR "{searchTerm}"
                </h2>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSearchResults({
                      spaces: [],
                      inventories: [],
                      items: [],
                      isSearching: false,
                    });
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  CLEAR SEARCH
                </button>
              </div>

              {!searchResults.spaces.length &&
                !searchResults.inventories.length &&
                !searchResults.items.length && (
                  <div className="text-gray-400 py-8 text-center">
                    No results found for "{searchTerm}"
                  </div>
                )}
              {/* Space search results */}
              {searchResults.spaces.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-light text-gray-400 tracking-wider mb-4">
                    SPACES ({searchResults.spaces.length})
                  </h3>
                  <TableView
                    data={searchResults.spaces}
                    columns={[
                      {
                        key: "name",
                        label: "NAME",
                      },
                      {
                        key: "description",
                        label: "DESCRIPTION",
                      },
                      {
                        key: "inventories",
                        label: "INVENTORIES",
                        render: (space) => (
                          <span>
                            {
                              inventories.filter(
                                (inv) => inv.parent_space_id === space.id
                              ).length
                            }
                          </span>
                        ),
                      },
                      {
                        key: "created_at",
                        label: "CREATED",
                        render: (space) => (
                          <span>
                            {new Date(space.created_at).toLocaleDateString()}
                          </span>
                        ),
                      },
                    ]}
                    onEdit={handleEditSpace}
                    onDelete={handleDeleteSpace}
                    onSelect={handleSelectSpace}
                    defaultViewMode="grid"
                  />
                </div>
              )}

              {/* Inventory search results */}
              {searchResults.inventories.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-light text-gray-400 tracking-wider mb-4">
                    INVENTORIES ({searchResults.inventories.length})
                  </h3>
                  <TableView
                    data={searchResults.inventories}
                    columns={[
                      {
                        key: "name",
                        label: "NAME",
                      },
                      {
                        key: "description",
                        label: "DESCRIPTION",
                      },
                      {
                        key: "items",
                        label: "ITEMS",
                        render: (inventory) => (
                          <span>
                            {
                              items.filter(
                                (item) => item.inventory_id === inventory.id
                              ).length
                            }
                          </span>
                        ),
                      },
                      {
                        key: "created_at",
                        label: "CREATED",
                        render: (inventory) => (
                          <span>
                            {new Date(
                              inventory.created_at
                            ).toLocaleDateString()}
                          </span>
                        ),
                      },
                    ]}
                    onEdit={handleEditInventory}
                    onDelete={handleDeleteInventory}
                    onSelect={setSelectedInventory}
                    defaultViewMode="grid"
                  />
                </div>
              )}

              {/* Item search results */}
              {searchResults.items.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-light text-gray-400 tracking-wider mb-4">
                    ITEMS ({searchResults.items.length})
                  </h3>
                  <TableView
                    data={searchResults.items}
                    columns={[
                      {
                        key: "name",
                        label: "NAME",
                      },
                      {
                        key: "quantity",
                        label: "QUANTITY",
                      },
                      {
                        key: "price",
                        label: "PRICE",
                        render: (item) =>
                          item.price ? `$${item.price.toFixed(2)}` : "-",
                      },
                      {
                        key: "description",
                        label: "DESCRIPTION",
                      },
                      {
                        key: "color",
                        label: "COLOR",
                        render: (item) =>
                          item.color ? (
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span>{item.color}</span>
                            </div>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        key: "inventory",
                        label: "INVENTORY",
                        render: (item) => {
                          const inv = inventories.find(
                            (i) => i.id === item.inventory_id
                          );
                          return inv ? inv.name : "-";
                        },
                      },
                      {
                        key: "created_at",
                        label: "CREATED",
                        render: (item) => (
                          <span>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        ),
                      },
                    ]}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onSelect={setSelectedItem}
                    defaultViewMode="table"
                  />
                </div>
              )}
            </div>
          )}

          {/* Normal Content (when not searching) */}

          {/* Space List */}
          {!searchResults.isSearching && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-light text-white tracking-wider">
                  SPACES
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveModal("space")}
                    disabled={!selectedGroupId}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors mr-2"
                    title="Add Space"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1">
                    <button
                      onClick={() => setSpacesViewMode("grid")}
                      className={`p-1 ${
                        spacesViewMode === "grid"
                          ? "bg-zinc-800 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSpacesViewMode("table")}
                      className={`p-1 ${
                        spacesViewMode === "table"
                          ? "bg-zinc-800 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {spaces.length === 0 ? (
                <p className="text-gray-500">No spaces available</p>
              ) : (
                <TableView
                  data={spaces}
                  columns={[
                    {
                      key: "name",
                      label: "NAME",
                    },
                    {
                      key: "description",
                      label: "DESCRIPTION",
                    },
                    {
                      key: "inventories",
                      label: "INVENTORIES",
                      render: (space) => (
                        <span>
                          {
                            inventories.filter(
                              (inv) => inv.parent_space_id === space.id
                            ).length
                          }
                        </span>
                      ),
                    },
                    {
                      key: "created_at",
                      label: "CREATED",
                      render: (space) => (
                        <span>
                          {new Date(space.created_at).toLocaleDateString()}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={handleEditSpace}
                  onDelete={handleDeleteSpace}
                  onSelect={handleSelectSpace}
                  selectedItemId={
                    selectedSpace ? (selectedSpace as Space).id : null
                  }
                  defaultViewMode="grid"
                  viewMode={spacesViewMode}
                  showViewToggle={false}
                  onDrop={async (target: any, payload) => {
                    if (payload.type === "item") {
                      await handleMoveItemToSpace(target.id, payload);
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Inventories List (shows under spaces, same style) */}
          {!searchResults.isSearching && selectedSpace && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-light text-white tracking-wider">
                  INVENTORIES
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // prefer to add inventory inside selected space or inventory
                      if (selectedSpace) {
                        setCreateInventoryParent({
                          type: "space",
                          id: selectedSpace.id,
                        });
                      } else if (selectedInventory) {
                        setCreateInventoryParent({
                          type: "inventory",
                          id: selectedInventory.id,
                        });
                      } else {
                        setCreateInventoryParent(null);
                      }
                      setActiveModal("inventory");
                    }}
                    disabled={!selectedGroupId}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors mr-2"
                    title="Add Inventory"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1">
                    <button
                      onClick={() => setInventoriesViewMode("grid")}
                      className={`p-1 ${
                        inventoriesViewMode === "grid"
                          ? "bg-zinc-800 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setInventoriesViewMode("table")}
                      className={`p-1 ${
                        inventoriesViewMode === "table"
                          ? "bg-zinc-800 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {(selectedSpace
                ? inventories.filter(
                    (inv) => inv.parent_space_id === selectedSpace.id
                  )
                : inventories
              ).length === 0 ? (
                <p className="text-gray-500">No inventories available</p>
              ) : (
                <TableView
                  data={
                    selectedSpace
                      ? inventories.filter(
                          (inv) => inv.parent_space_id === selectedSpace.id
                        )
                      : inventories
                  }
                  columns={[
                    { key: "name", label: "NAME" },
                    { key: "description", label: "DESCRIPTION" },
                    {
                      key: "items",
                      label: "ITEMS",
                      render: (inventory: Inventory) => (
                        <span>
                          {
                            items.filter(
                              (item) => item.inventory_id === inventory.id
                            ).length
                          }
                        </span>
                      ),
                    },
                    {
                      key: "created_at",
                      label: "CREATED",
                      render: (inventory: Inventory) => (
                        <span>
                          {new Date(inventory.created_at).toLocaleDateString()}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={handleEditInventory}
                  onDelete={handleDeleteInventory}
                  onSelect={(inv: Inventory) => setSelectedInventory(inv)}
                  selectedItemId={
                    selectedInventory
                      ? (selectedInventory as Inventory).id
                      : null
                  }
                  defaultViewMode="grid"
                  viewMode={inventoriesViewMode}
                  showViewToggle={false}
                  onDrop={async (target: any, payload) => {
                    // if payload.type is 'item', move that item into this inventory
                    if (payload.type === "item") {
                      await handleMoveItemToInventory(target.id, payload);
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Items for selected inventory (appear under INVENTORIES) */}
          {!searchResults.isSearching && selectedInventory && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-gray-400 tracking-wider">
                  ITEMS IN {selectedInventory.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setCreateItemInventoryId(selectedInventory.id);
                      setActiveModal("item");
                    }}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors"
                    title="Add Item to this inventory"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1">
                    <button
                      onClick={() => setItemsViewMode("grid")}
                      className={`p-1 ${
                        itemsViewMode === "grid"
                          ? "bg-zinc-800 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setItemsViewMode("table")}
                      className={`p-1 ${
                        itemsViewMode === "table"
                          ? "bg-zinc-800 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {items.filter(
                (item) => item.inventory_id === selectedInventory.id
              ).length === 0 ? (
                <p className="text-gray-500">No items in this inventory</p>
              ) : (
                <TableView
                  data={items.filter(
                    (item) => item.inventory_id === selectedInventory.id
                  )}
                  columns={[
                    { key: "name", label: "NAME" },
                    { key: "quantity", label: "QUANTITY" },
                    {
                      key: "price",
                      label: "PRICE",
                      render: (item: Item) =>
                        item.price ? `$${item.price.toFixed(2)}` : "-",
                    },
                    { key: "description", label: "DESCRIPTION" },
                    {
                      key: "color",
                      label: "COLOR",
                      render: (item: Item) =>
                        item.color ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span>{item.color}</span>
                          </div>
                        ) : (
                          "-"
                        ),
                    },
                    {
                      key: "created_at",
                      label: "CREATED",
                      render: (item: Item) => (
                        <span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onSelect={setSelectedItem}
                  selectedItemId={selectedItem?.id ?? null}
                  defaultViewMode="table"
                  viewMode={itemsViewMode}
                  showViewToggle={false}
                  dragType="item"
                />
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {activeModal === "space" && (
          <CreateSpaceModal
            groupId={selectedGroupId}
            spaces={spaces}
            onClose={handleModalClose}
            onSpaceCreated={handleEntityCreated}
          />
        )}

        {activeModal === "inventory" && (
          <CreateInventoryModal
            groupId={selectedGroupId}
            spaces={spaces}
            inventories={inventories}
            onClose={handleModalClose}
            onInventoryCreated={handleEntityCreated}
            initialParent={createInventoryParent ?? undefined}
          />
        )}

        {activeModal === "item" && (
          <CreateItemModal
            groupId={selectedGroupId}
            inventories={inventories}
            onClose={handleModalClose}
            onItemCreated={handleEntityCreated}
            initialInventoryId={createItemInventoryId ?? undefined}
          />
        )}

        {selectedItem && (
          <ViewItemModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {activeModal === "group" && (
          <CreateGroupModal
            onClose={handleModalClose}
            onGroupCreated={async (name) => {
              await handleCreateGroup(name);
              handleEntityCreated();
            }}
          />
        )}

        {/* Edit Modals */}
        {activeModal === "editSpace" && spaceToEdit && (
          <EditSpaceModal
            space={spaceToEdit}
            spaces={spaces}
            onClose={() => {
              setActiveModal(null);
              setSpaceToEdit(null);
            }}
            onSpaceUpdated={handleEntityCreated}
          />
        )}

        {activeModal === "editInventory" && inventoryToEdit && (
          <EditInventoryModal
            inventory={inventoryToEdit}
            spaces={spaces}
            inventories={inventories}
            onClose={() => {
              setActiveModal(null);
              setInventoryToEdit(null);
            }}
            onInventoryUpdated={handleEntityCreated}
          />
        )}

        {activeModal === "editItem" && itemToEdit && (
          <EditItemModal
            item={itemToEdit}
            inventories={inventories}
            onClose={() => {
              setActiveModal(null);
              setItemToEdit(null);
            }}
            onItemUpdated={handleEntityCreated}
          />
        )}

        {/* Profile Modal */}
        {activeModal === "profile" && (
          <ProfileModal onClose={() => setActiveModal(null)} />
        )}

        {/* Group Members Modal */}
        {activeModal === "members" && selectedGroupId && (
          <GroupMembersModal
            groupId={selectedGroupId}
            groupName={
              groups.find((g) => g.id === selectedGroupId)?.name || "Group"
            }
            ownerId={
              groups.find((g) => g.id === selectedGroupId)?.owner_id || ""
            }
            onClose={() => setActiveModal(null)}
            onInviteClick={() => setActiveModal("invite")}
            fetchMembers={fetchGroupMembers}
            updateMemberRole={updateMemberRole}
            removeMember={removeMemberFromGroup}
            updateGroup={async (groupId: string, data: any) => {
              try {
                await updateGroup(groupId, data);
              } catch (err) {
                console.error("Error updating group from modal", err);
                throw err;
              }
            }}
            deleteGroup={async (groupId: string) => {
              try {
                await deleteGroup(groupId);
                // if deleted group was selected, clear selection
                if (selectedGroupId === groupId) {
                  setSelectedGroupId("");
                }
                // refresh groups
                try {
                  // refetch groups
                  // useGroups provides fetch via refetch
                  // but it's not exported here; calling fetchData will be enough for now
                } catch {}
                return true;
              } catch (err) {
                console.error("Error deleting group from modal", err);
                throw err;
              }
            }}
          />
        )}

        {/* Invite User Modal */}
        {activeModal === "invite" && selectedGroupId && (
          <InviteUserModal
            groupId={selectedGroupId}
            groupName={
              groups.find((g) => g.id === selectedGroupId)?.name || "Group"
            }
            onClose={() => setActiveModal("members")}
            onUserInvited={() => {
              // Return to members view
              setActiveModal("members");
            }}
            onInviteUser={async (email, isAdmin) => {
              await inviteUserToGroup(selectedGroupId, email, isAdmin);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalConfig.isOpen && (
          <DeleteConfirmationModal
            title={deleteModalConfig.title}
            message={deleteModalConfig.message}
            onClose={() =>
              setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={deleteModalConfig.onConfirm}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// --- CreateMenu component ---
type CreateMenuProps = {
  selectedGroupId: string;
  onOpenModal: (type: "space" | "inventory" | "item") => void;
};

const CreateMenu: React.FC<CreateMenuProps> = ({
  selectedGroupId,
  onOpenModal,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`w-full sm:w-auto bg-zinc-900 border border-zinc-800 px-4 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors flex items-center justify-center`}
        disabled={!selectedGroupId}
        aria-label="Create menu"
      >
        <span className="text-lg">+</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-full sm:w-56 bg-zinc-900 border border-zinc-800 rounded-none shadow-lg z-40">
          <ul>
            <li>
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenModal("space");
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800"
                disabled={!selectedGroupId}
              >
                Add Space
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenModal("inventory");
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800"
                disabled={!selectedGroupId}
              >
                Add Inventory
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenModal("item");
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800"
                disabled={!selectedGroupId}
              >
                Add Item
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
