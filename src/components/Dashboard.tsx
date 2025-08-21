import { Box, Home, LogOut, Package, Search, UserCircle, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGroups } from "../hooks/useGroups";
import { supabase } from "../lib/supabase";
import CreateGroupModal from "./modals/CreateGroupModal";
import CreateInventoryModal from "./modals/CreateInventoryModal";
import CreateItemModal from "./modals/CreateItemModal";
import CreateSpaceModal from "./modals/CreateSpaceModal";
import EditSpaceModal from "./modals/EditSpaceModal";
import EditInventoryModal from "./modals/EditInventoryModal";
import EditItemModal from "./modals/EditItemModal";
import ViewItemModal from "./modals/ViewItemModal";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import ProfileModal from "./modals/ProfileModal";
import GroupMembersModal from "./modals/GroupMembersModal";
import InviteUserModal from "./modals/InviteUserModal";
import NotificationsBell from "./PendingInvitations";
import { TableView } from "./TableView";

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
  const { 
    groups, 
    loading: groupsLoading, 
    createGroup, 
    fetchGroupMembers, 
    inviteUserToGroup,
    updateMemberRole,
    removeMemberFromGroup
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
    isSearching: false
  });
  const [activeModal, setActiveModal] = useState<
    "space" | "inventory" | "item" | "group" | "editSpace" | "editInventory" | "editItem" | "profile" | "members" | "invite" | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null
  );
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [spaceToEdit, setSpaceToEdit] = useState<Space | null>(null);
  const [inventoryToEdit, setInventoryToEdit] = useState<Inventory | null>(null);
  
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
      
      // Reset search if active
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults({
          spaces: [],
          inventories: [],
          items: [],
          isSearching: false
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
        isSearching: false
      });
      return;
    }
    
    const searchTermLower = term.toLowerCase();
    
    // Search in spaces
    const filteredSpaces = spaces.filter(space => 
      space.name.toLowerCase().includes(searchTermLower) || 
      (space.description && space.description.toLowerCase().includes(searchTermLower))
    );
    
    // Search in inventories
    const filteredInventories = inventories.filter(inventory => 
      inventory.name.toLowerCase().includes(searchTermLower) || 
      (inventory.description && inventory.description.toLowerCase().includes(searchTermLower))
    );
    
    // Search in items
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchTermLower) || 
      (item.description && item.description.toLowerCase().includes(searchTermLower)) ||
      (item.color && item.color.toLowerCase().includes(searchTermLower)) ||
      (item.price && item.price.toString().includes(searchTermLower)) ||
      (item.quantity && item.quantity.toString().includes(searchTermLower))
    );
    
    setSearchResults({
      spaces: filteredSpaces,
      inventories: filteredInventories,
      items: filteredItems,
      isSearching: true
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
  };

  const handleEntityCreated = async () => {
    setActiveModal(null);
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
    setSelectedSpace(space);
    // Clear search when selecting a space
    if (searchTerm) {
      setSearchTerm("");
      setSearchResults({
        spaces: [],
        inventories: [],
        items: [],
        isSearching: false
      });
    }
  };

  const deleteSpace = async (space: Space) => {
    try {
      const { error } = await supabase.from("spaces").delete().eq("id", space.id);
      if (error) throw error;
      await fetchData();
      if (selectedSpace?.id === space.id) {
        setSelectedSpace(null);
      }
    } catch (error) {
      console.error("Error deleting space:", error);
      alert("No se pudo eliminar el espacio. Es posible que contenga inventarios.");
    }
  };

  const deleteInventory = async (inventory: Inventory) => {
    try {
      const { error } = await supabase.from("inventories").delete().eq("id", inventory.id);
      if (error) throw error;
      await fetchData();
      if (selectedInventory?.id === inventory.id) {
        setSelectedInventory(null);
      }
    } catch (error) {
      console.error("Error deleting inventory:", error);
      alert("No se pudo eliminar el inventario. Es posible que contenga artículos.");
    }
  };

  const deleteItem = async (item: Item) => {
    try {
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("No se pudo eliminar el artículo.");
    }
  };

  const handleDeleteSpace = (space: Space) => {
    setDeleteModalConfig({
      title: "Delete Space",
      message: `Are you sure you want to delete "${space.name}"? This action cannot be undone.`,
      onConfirm: () => deleteSpace(space),
      isOpen: true
    });
  };

  const handleDeleteInventory = (inventory: Inventory) => {
    setDeleteModalConfig({
      title: "Delete Inventory",
      message: `Are you sure you want to delete "${inventory.name}"? This action cannot be undone.`,
      onConfirm: () => deleteInventory(inventory),
      isOpen: true
    });
  };

  const handleDeleteItem = (item: Item) => {
    setDeleteModalConfig({
      title: "Delete Item",
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      onConfirm: () => deleteItem(item),
      isOpen: true
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
            onClick={() => handleCreateGroup("New Group")}
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

            <div className="flex items-center">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-black border border-zinc-800 px-4 py-2 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              
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

            <button
              onClick={() => setActiveModal("group")}
              className="text-gray-400 hover:text-white transition-colors text-sm font-light tracking-wider"
            >
              + NEW GROUP
            </button>
          </div>

          <div className="flex items-center space-x-4">
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
              <span className="text-sm font-light tracking-wider">SIGN OUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
  {/* Pending invitations are now in the header notifications bell */}
        
        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search spaces, inventories, items..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors w-96"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveModal("space")}
              disabled={!selectedGroupId}
              className={`bg-zinc-900 border border-zinc-800 px-4 py-2 font-light text-sm tracking-wider ${selectedGroupId ? 'text-white hover:border-white' : 'text-gray-600 cursor-not-allowed'} transition-colors flex items-center space-x-2`}
            >
              <Home className="w-4 h-4" />
              <span>ADD SPACE</span>
            </button>

            <button
              onClick={() => setActiveModal("inventory")}
              className="bg-zinc-900 border border-zinc-800 px-4 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>ADD INVENTORY</span>
            </button>

            <button
              onClick={() => setActiveModal("item")}
              className="bg-white text-black px-6 py-2 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Box className="w-4 h-4" />
              <span>ADD ITEM</span>
            </button>
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
                      isSearching: false
                    });
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  CLEAR SEARCH
                </button>
              </div>
              
              {/* No results message */}
              {!searchResults.spaces.length && !searchResults.inventories.length && !searchResults.items.length && (
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
                            {inventories.filter(
                              (inv) => inv.parent_space_id === space.id
                            ).length}
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
                            {new Date(inventory.created_at).toLocaleDateString()}
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
                          const inv = inventories.find(i => i.id === item.inventory_id);
                          return inv ? inv.name : "-";
                        }
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
          {!searchResults.isSearching && selectedSpace && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-white tracking-wider">
                  {selectedSpace.name}
                </h2>
                <button
                  onClick={() => setSelectedSpace(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Inventories in Selected Space */}
              <div className="mb-8">
                <h3 className="text-lg font-light text-gray-400 tracking-wider mb-4">
                  INVENTORIES
                </h3>
                {inventories.filter(
                  (inv) => inv.parent_space_id === selectedSpace.id
                ).length === 0 ? (
                  <p className="text-gray-500">No inventories in this space</p>
                ) : (
                  <TableView
                    data={inventories.filter(
                      (inv) => inv.parent_space_id === selectedSpace.id
                    )}
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
                            {new Date(inventory.created_at).toLocaleDateString()}
                          </span>
                        ),
                      },
                    ]}
                    onEdit={handleEditInventory}
                    onDelete={handleDeleteInventory}
                    onSelect={setSelectedInventory}
                    defaultViewMode="grid"
                  />
                )}
              </div>

              {/* Items in Selected Inventory */}
              {selectedInventory && (
                <div>
                  <h3 className="text-lg font-light text-gray-400 tracking-wider mb-4">
                    ITEMS IN {selectedInventory.name}
                  </h3>
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* Space List */}
          {!selectedSpace && !searchResults.isSearching && (
            <div>
              <h2 className="text-xl font-light text-white tracking-wider mb-4">
                SPACES
              </h2>
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
                          {inventories.filter(
                            (inv) => inv.parent_space_id === space.id
                          ).length}
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
          />
        )}

        {activeModal === "item" && (
          <CreateItemModal
            groupId={selectedGroupId}
            inventories={inventories}
            onClose={handleModalClose}
            onItemCreated={handleEntityCreated}
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
            groupName={groups.find(g => g.id === selectedGroupId)?.name || "Group"}
            ownerId={groups.find(g => g.id === selectedGroupId)?.owner_id || ""}
            onClose={() => setActiveModal(null)}
            onInviteClick={() => setActiveModal("invite")}
            fetchMembers={fetchGroupMembers}
            updateMemberRole={updateMemberRole}
            removeMember={removeMemberFromGroup}
          />
        )}
        
        {/* Invite User Modal */}
        {activeModal === "invite" && selectedGroupId && (
          <InviteUserModal
            groupId={selectedGroupId}
            groupName={groups.find(g => g.id === selectedGroupId)?.name || "Group"}
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
            onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
            onConfirm={deleteModalConfig.onConfirm}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
