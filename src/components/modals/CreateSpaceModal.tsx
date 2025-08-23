import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useToast } from "../toast/Toast";
import { ModalAnimations } from "./ModalAnimations";

interface Space {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

interface CreateSpaceModalProps {
  groupId: string;
  spaces: Space[];
  onClose: () => void;
  onSpaceCreated: () => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  groupId,
  spaces,
  onClose,
  onSpaceCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshSession } = useAuth();
  const { push } = useToast();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    if (!groupId) {
      setErrorMessage("Selecciona un grupo antes de crear un espacio.");
      setLoading(false);
      return;
    }
    try {
      const { data: created, error } = await supabase
        .from("spaces")
        .insert([
          {
            group_id: groupId,
            name: formData.name,
            description: formData.description || null,
            parent_id: formData.parent_id || null,
          },
        ])
        .select()
        .single();

      if (!error && created) {
        console.log("Space created:", created);
        push({ message: `Espacio "${created.name}" creado.`, type: "success" });
        onSpaceCreated();
        return;
      }

      if (error) {
        // RLS error: inform user/admin
        if (
          error.code === "42501" ||
          error.message?.includes("row-level security")
        ) {
          const msg =
            "No tienes permisos para crear espacios en este grupo (RLS). Pide al administrador que revise las políticas.";
          setErrorMessage(msg);
          push({ message: msg, type: "error" });
          console.error("RLS error creating space:", error);
          throw error;
        }

        // Try refresh for auth-related errors once
        if (
          error.code === "401" ||
          error.code === "403" ||
          error.message?.includes("JWT")
        ) {
          const refreshed = await refreshSession();
          if (!refreshed) {
            const msg =
              "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
            setErrorMessage(msg);
            push({ message: msg, type: "error" });
            throw new Error("Session refresh failed");
          }

          const { data: createdRetry, error: retryErr } = await supabase
            .from("spaces")
            .insert([
              {
                group_id: groupId,
                name: formData.name,
                description: formData.description || null,
                parent_id: formData.parent_id || null,
              },
            ])
            .select()
            .single();

          if (retryErr) {
            // If still error after refresh, show message
            const msg =
              "No se pudo crear el espacio después de refrescar la sesión.";
            setErrorMessage(msg);
            push({ message: msg, type: "error" });
            console.error("Retry error creating space:", retryErr);
            throw retryErr;
          }

          if (createdRetry) {
            push({
              message: `Espacio "${createdRetry.name}" creado.`,
              type: "success",
            });
            onSpaceCreated();
            return;
          }
        }

        // Fallback: generic error
        setErrorMessage(
          "Error al crear el espacio: " +
            (error.message || JSON.stringify(error))
        );
        push({ message: "Error al crear el espacio", type: "error" });
        throw error;
      }
    } catch (err) {
      console.error("Error creating space:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/0 backdrop-blur-0 z-50 transition-all duration-300"
        style={{ animation: "fadeIn 0.3s ease-out forwards" }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto modal-scroll"
          style={{ animation: "slideUp 0.3s ease-out forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
            <h2 className="text-lg font-light tracking-wider text-white">
              CREATE SPACE
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMessage && (
              <div className="bg-red-900/30 border border-red-800 p-4 mb-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">{errorMessage}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                NAME
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. Living Room, Kitchen"
              />
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                PARENT SPACE (OPTIONAL)
              </label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
              >
                <option value="">No parent space</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                DESCRIPTION (OPTIONAL)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
                placeholder="Describe this space"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-zinc-800 py-3 font-light text-sm tracking-wider text-gray-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-black py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "CREATING..." : "CREATE SPACE"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default CreateSpaceModal;
