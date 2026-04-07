import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { marketApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { MARKET_CATEGORIES, MARKET_CONDITIONS } from "@/types/market";
import type { MarketPost } from "@/types/market";
import {
  ShoppingCart,
  ChevronLeft,
  Loader2,
  Plus,
  X,
  Tag,
  DollarSign,
  Phone,
  Upload,
  Link as LinkIcon,
} from "lucide-react";

export default function EditMarketPostPage() {
  const { id } = useParams<{ id: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("good");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketApi.getPost(id!);
      if (response.success && response.data) {
        const post = response.data;
        if (post.user_id !== user?.id) {
          toast.error("You don't have permission to edit this post");
          navigate("/market");
          return;
        }
        setTitle(post.title);
        setDescription(post.description);
        setPrice(post.price.toString());
        setCategory(post.category);
        setCondition(post.condition);
        setTags(post.tags || []);
        setPhoneNumber(post.phone_number || "");
        setReferenceLinks(post.reference_links || []);
        setImages(post.images || []);
      } else {
        toast.error("Post not found");
        navigate("/market");
      }
    } catch (error) {
      toast.error("Failed to fetch post");
      navigate("/market");
    }
    setIsLoading(false);
  }, [id, user?.id, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchPost();
  }, [id, isAuthenticated, navigate, fetchPost]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 4 - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("images", file);
      });

      const response = await marketApi.uploadImages(formData);

      if (response.success && response.urls) {
        setImages((prev) => [...prev, ...response.urls]);
        toast.success(`${response.urls.length} image(s) uploaded`);
      } else {
        toast.error(response.message || "Failed to upload images");
      }
    } catch (error) {
      toast.error("Failed to upload images");
    }

    setIsUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = (inputTag?: string) => {
    const rawInput = inputTag || tagInput;
    // Split by comma and process each tag
    const newTags = rawInput
      .split(",")
      .map((t) =>
        t
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]/g, ""),
      )
      .filter((t) => t.length > 0);

    if (newTags.length === 0) return;

    let addedCount = 0;
    let duplicateCount = 0;

    for (const tag of newTags) {
      if (tags.includes(tag)) {
        duplicateCount++;
        continue;
      }
      if (tags.length + addedCount >= 5) {
        toast.error("Maximum 5 tags allowed");
        break;
      }
      setTags((prev) => [...prev, tag]);
      addedCount++;
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} tag${addedCount > 1 ? "s" : ""}`);
    }
    if (duplicateCount > 0) {
      toast.error(
        `${duplicateCount} tag${duplicateCount > 1 ? "s" : ""} already added`,
      );
    }

    setTagInput("");
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    const link = linkInput.trim();
    if (!link) return;
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      toast.error("Please enter a valid URL");
      return;
    }
    if (referenceLinks.includes(link)) {
      toast.error("Link already added");
      return;
    }
    if (referenceLinks.length >= 3) {
      toast.error("Maximum 3 reference links allowed");
      return;
    }
    setReferenceLinks((prev) => [...prev, link]);
    setLinkInput("");
  };

  const removeLink = (index: number) => {
    setReferenceLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await marketApi.updatePost(id!, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        condition,
        images,
        tags,
        phone_number: phoneNumber.trim() || undefined,
        reference_links: referenceLinks.length > 0 ? referenceLinks : undefined,
      });

      if (response.success) {
        toast.success("Post updated successfully!");
        navigate(`/market/${id}`);
      } else {
        toast.error(response.message || "Failed to update post");
      }
    } catch (error) {
      toast.error("Failed to update post");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Navigation />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Navigation />

      <main className="pt-16 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to={`/market/${id}`}
            className={`inline-flex items-center gap-2 mb-6 ${
              isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Post
          </Link>

          <div
            className={`rounded-2xl p-6 md:p-8 ${
              isDark
                ? "bg-slate-900/80 border border-slate-800 backdrop-blur-xl"
                : "bg-white/80 border border-slate-200 backdrop-blur-xl shadow-lg"
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Edit Market Post
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label
                  htmlFor="title"
                  className={isDark ? "text-slate-300" : ""}
                >
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you selling?"
                  className={`mt-2 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                  maxLength={100}
                />
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className={isDark ? "text-slate-300" : ""}
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item in detail..."
                  className={`mt-2 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                  rows={5}
                  maxLength={2000}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="price"
                    className={isDark ? "text-slate-300" : ""}
                  >
                    Price (¥) *
                  </Label>
                  <div className="relative mt-2">
                    <DollarSign
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className={`pl-10 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="category"
                    className={isDark ? "text-slate-300" : ""}
                  >
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full mt-2 px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    } border`}
                  >
                    <option value="">Select a category</option>
                    {MARKET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="condition"
                  className={isDark ? "text-slate-300" : ""}
                >
                  Condition *
                </Label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={`w-full mt-2 px-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-300"
                  } border`}
                >
                  {MARKET_CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className={isDark ? "text-slate-300" : ""}>
                  Images (Max 4)
                </Label>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-3 mb-3">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className={`relative w-24 h-24 rounded-lg overflow-hidden ${
                          isDark ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <label
                        className={`w-24 h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          isUploading
                            ? "opacity-50 cursor-not-allowed"
                            : isDark
                              ? "bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600"
                              : "bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300"
                        }`}
                      >
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        ) : (
                          <>
                            <Upload
                              className={`w-6 h-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            />
                            <span
                              className={`text-xs mt-1 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Add
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          disabled={isUploading || images.length >= 4}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Upload up to 4 images. First image will be the cover.
                  </p>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="tags"
                  className={isDark ? "text-slate-300" : ""}
                >
                  Tags (Max 5)
                </Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Tag
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Auto-add tags when comma is typed
                        if (value.includes(",")) {
                          addTag(value);
                        } else {
                          setTagInput(value);
                        }
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                      placeholder="books, phone, laptop (comma separated)"
                      className={`pl-10 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                      disabled={tags.length >= 5}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag()}
                    disabled={tags.length >= 5 || !tagInput.trim()}
                    className={isDark ? "border-slate-700" : ""}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                          isDark
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className={isDark ? "text-slate-300" : ""}
                >
                  Phone Number (Optional)
                </Label>
                <div className="relative mt-2">
                  <Phone
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="For buyers to contact you"
                    className={`pl-10 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="links"
                  className={isDark ? "text-slate-300" : ""}
                >
                  Reference Links (Optional, Max 3)
                </Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <LinkIcon
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <Input
                      id="links"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addLink())
                      }
                      placeholder="https://..."
                      className={`pl-10 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                      disabled={referenceLinks.length >= 3}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLink}
                    disabled={referenceLinks.length >= 3}
                    className={isDark ? "border-slate-700" : ""}
                  >
                    Add
                  </Button>
                </div>
                {referenceLinks.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {referenceLinks.map((link, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          isDark ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <span
                          className={`text-sm truncate flex-1 ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className={`ml-2 p-1 rounded hover:bg-slate-700 ${
                            isDark
                              ? "text-slate-400 hover:text-red-400"
                              : "text-slate-500 hover:text-red-500"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/market/${id}`)}
                  className={`flex-1 ${isDark ? "border-slate-700" : ""}`}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
