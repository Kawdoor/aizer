import { Save, User, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ModalAnimations } from "./ModalAnimations";

interface Profile {
  id: string;
  display_name: string | null;
  accent_color: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    accent_color: "#FFFFFF",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchProfile();

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || "",
          accent_color: data.accent_color || "#FFFFFF",
        });
      } else {
        // No profile exists yet, will create one on save
        setFormData({
          display_name: user.email?.split("@")[0] || "",
          accent_color: "#FFFFFF",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update({
            display_name: formData.display_name,
            accent_color: formData.accent_color,
          })
          .eq("id", user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase.from("profiles").insert([
          {
            id: user.id,
            display_name: formData.display_name,
            accent_color: formData.accent_color,
          },
        ]);

        if (error) throw error;
      }

      setMessage({ text: "Profile updated successfully", type: "success" });
      await fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
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
            <h2 className="text-lg font-light tracking-wider text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              PROFILE SETTINGS
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400">
              Loading profile data...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {message && (
                <div
                  className={`p-3 text-sm mb-4 ${
                    message.type === "success"
                      ? "bg-green-900/30 border border-green-800 text-green-300"
                      : "bg-red-900/30 border border-red-800 text-red-300"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-gray-500 font-light text-sm tracking-wide focus:outline-none transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  ACCENT COLOR
                </label>
                <div className="flex space-x-3 items-center">
                  <input
                    type="color"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleChange}
                    className="bg-black border border-zinc-800 h-10 w-10"
                  />
                  <input
                    type="text"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleChange}
                    className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center space-x-2 bg-white text-black py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <span>SAVING...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>SAVE PROFILE</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default ProfileModal;
