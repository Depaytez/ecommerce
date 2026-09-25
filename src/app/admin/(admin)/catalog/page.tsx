/**
 * Products Catalog Page
 *
 * Admin can create, edit, delete, and manage products.
 * Access: Admin, Chief Admin, Agent
 *
 * Features:
 * - Auto-generate slug from name
 * - Auto-generate SKU from category
 * - Supabase Storage for media uploads
 * - Toast notifications
 */

"use client";

import { useState, useEffect } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  checkPermission,
  uploadProductMedia,
} from "../admin-actions";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  Image as ImageIcon,
  X,
  Upload,
  FileVideo,
  Loader2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import type { Product } from "@/types";
import { useToast } from "@/context/ToastContext";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useAdmin } from "@/context/AdminContext";

// Category options with icons and colors
const CATEGORY_OPTIONS = [
  {
    name: "Skincare",
    icon: "✨",
    color: "bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200",
  },
  {
    name: "Makeup",
    icon: "💄",
    color:
      "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200",
  },
  {
    name: "Hair Care",
    icon: "💇",
    color: "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200",
  },
  {
    name: "Fragrance",
    icon: "🌸",
    color: "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200",
  },
  {
    name: "Body Care",
    icon: "🧴",
    color: "bg-green-100 border-green-300 text-green-700 hover:bg-green-200",
  },
  {
    name: "Tools & Accessories",
    icon: "💅",
    color: "bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200",
  },
  {
    name: "Men's Care",
    icon: "👨",
    color: "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200",
  },
  {
    name: "General",
    icon: "📦",
    color: "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200",
  },
];

export default function ProductsCatalogPage() {
  const adminContext = useAdmin();
  const { success, error: showError } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    return adminContext ? adminContext.isAgent : true;
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state with multi-currency support
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    price: "",
    discount_price: "",
    stock_quantity: "",
    sku: "",
    // Multi-currency fields
    currency: "NGN",
    usd_price: "",
    usd_discount_price: "",
    exchange_rate: "1.0",
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (adminContext) {
      setHasAccess(adminContext.isAgent);
    } else {
      checkPermissions();
    }
    loadProducts();
  }, [adminContext]);

  async function checkPermissions() {
    const hasPermission = await checkPermission("agent");
    setHasAccess(hasPermission);
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const { getProducts } = await import("@/utils/supabase/services-server");
      const result = await getProducts({ is_active: undefined });
      setProducts(result);
    } catch (error) {
      console.error("Error loading products:", error);
      showError("Failed to load products");
    }
    setLoading(false);
  }

  // Auto-generate slug from name
  function generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Auto-generate SKU from category
  function generateSKUFromCategory(category: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const categoryPrefix = category
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    return `JRAD-${categoryPrefix}-${timestamp}-${random}`;
  }

  // Handle name change - auto-generate slug
  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlugFromName(name),
    }));
  }

  // Handle category change - auto-generate SKU based on category
  // Always updates SKU when category changes (for new products)
  // For editing, only updates if SKU matches old category pattern
  function handleCategoryChange(category: string) {
    setFormData((prev) => {
      const newSku = generateSKUFromCategory(category);

      // For new products: always use auto-generated SKU
      // For editing: only update if current SKU matches old category pattern
      const shouldUpdateSku =
        !editingProduct ||
        prev.sku.startsWith(`JRAD-${category.substring(0, 3).toUpperCase()}`);

      return {
        ...prev,
        category,
        sku: shouldUpdateSku ? newSku : prev.sku,
      };
    });
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      category: product.category ?? "",
      price: product.price?.toString() ?? "",
      discount_price: product.discount_price?.toString() ?? "",
      stock_quantity: product.stock_quantity?.toString() ?? "0",
      sku: product.sku ?? "",
      // Multi-currency fields
      currency: (product as any).currency ?? "NGN",
      usd_price: (product as any).usd_price?.toString() ?? "",
      usd_discount_price: (product as any).usd_discount_price?.toString() ?? "",
      exchange_rate: (product as any).exchange_rate?.toString() ?? "1.0",
    });
    setUploadedImages(product.images ?? []);
    setSelectedFiles([]);
    setShowModal(true);
  }

  function handleCreate() {
    setEditingProduct(null);
    const tempCategory = "General";
    setFormData({
      name: "",
      slug: "",
      description: "",
      category: tempCategory,
      price: "",
      discount_price: "",
      stock_quantity: "",
      sku: generateSKUFromCategory(tempCategory),
      // Multi-currency fields
      currency: "NGN",
      usd_price: "",
      usd_discount_price: "",
      exchange_rate: "1.0",
    });
    setUploadedImages([]);
    setSelectedFiles([]);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading("submit");
    setUploading(true);

    try {
      let finalImages = [...uploadedImages];

      // Upload new files if any
      if (selectedFiles.length > 0) {
        const uploadFormData = new FormData();
        selectedFiles.forEach((file) => uploadFormData.append("files", file));

        const uploadResult = await uploadProductMedia(
          uploadFormData,
          "products",
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload media");
        }

        // Add uploaded URLs to images array
        finalImages = [
          ...finalImages,
          ...uploadResult.results!.map((r) => r.url),
        ];
      }

      // Validate required fields
      if (!formData.name.trim()) {
        showError("Product name is required");
        return;
      }
      if (!formData.category.trim()) {
        showError("Product category is required");
        return;
      }
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        showError("Valid price is required");
        return;
      }
      const stockQuantity = parseInt(formData.stock_quantity);
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        showError("Valid stock quantity is required");
        return;
      }
      const discountPrice = formData.discount_price
        ? parseFloat(formData.discount_price)
        : null;
      if (discountPrice !== null && discountPrice >= price) {
        showError("Discount price must be less than original price");
        return;
      }

      const productData = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlugFromName(formData.name),
        description: formData.description.trim() || null,
        category: formData.category.trim(),
        price,
        discount_price: discountPrice,
        stock_quantity: stockQuantity,
        sku: formData.sku.trim() || generateSKUFromCategory(formData.category),
        images: finalImages,
        attributes: {},
        // Multi-currency fields
        currency: formData.currency,
        usd_price: formData.usd_price ? parseFloat(formData.usd_price) : null,
        usd_discount_price: formData.usd_discount_price
          ? parseFloat(formData.usd_discount_price)
          : null,
        exchange_rate: formData.exchange_rate
          ? parseFloat(formData.exchange_rate)
          : 1.0,
      };

      let result;
      if (editingProduct) {
        result = await updateProduct(editingProduct.id, productData);
      } else {
        result = await createProduct(productData);
      }

      if (result.success) {
        success(editingProduct ? "Product updated" : "Product created");
        setShowModal(false);
        loadProducts();
      } else {
        showError(result.error || "Operation failed");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
      setActionLoading(null);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setActionLoading(productId);
    const result = await deleteProduct(productId);
    if (result.success) {
      success("Product deleted successfully");
      loadProducts();
    } else {
      showError(result.error || "Failed to delete product");
    }
    setActionLoading(null);
  }

  async function handleToggleStatus(productId: string) {
    setActionLoading(productId);
    const result = await toggleProductStatus(productId);
    if (result.success) {
      success(result.message || "Status updated");
      loadProducts();
    } else {
      showError(result.error || "Failed to update status");
    }
    setActionLoading(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  }

  function handleRemoveFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoveUploadedUrl(url: string) {
    setUploadedImages((prev) => prev.filter((img) => img !== url));
  }

  if (!loading && hasAccess === false) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">
          You don&apos;t have administrative permissions to view or manage the product catalog.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-gray-100 p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">
            Products Catalog
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all products in your store
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-radiance-goldColor text-white px-6 py-3 rounded-xl font-bold hover:bg-radiance-charcoalTextColor transition-colors"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2
            size={48}
            className="animate-spin mx-auto text-radiance-goldColor"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.sku || "No SKU"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₦
                        {(
                          product.discount_price || product.price
                        ).toLocaleString()}
                      </div>
                      {product.discount_price && (
                        <div className="text-xs text-gray-500 line-through">
                          ₦{product.price.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.stock_quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          disabled={actionLoading === product.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title={product.is_active ? "Deactivate" : "Activate"}
                        >
                          <ToggleLeft size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={actionLoading === product.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Create Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                    required
                    disabled={uploading || actionLoading === "submit"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug{" "}
                    <span className="text-xs text-gray-500">
                      (auto-generated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                    disabled={uploading || actionLoading === "submit"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <RichTextEditor
                  content={formData.description}
                  onChange={(html) =>
                    setFormData({ ...formData, description: html })
                  }
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => handleCategoryChange(category.name)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.category === category.name
                          ? `${category.color} border-current shadow-md scale-105`
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      disabled={uploading || actionLoading === "submit"}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-xs font-semibold text-center leading-tight">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU{" "}
                    <span className="text-xs text-gray-500">
                      (auto-generated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                    disabled={uploading || actionLoading === "submit"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                    required
                    disabled={uploading || actionLoading === "submit"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Price (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_price: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                    disabled={uploading || actionLoading === "submit"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                    required
                    disabled={uploading || actionLoading === "submit"}
                  />
                </div>
              </div>

              {/* Multi-Currency Pricing Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <DollarSign size={16} />
                  International Pricing (USD)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.usd_price}
                      onChange={(e) =>
                        setFormData({ ...formData, usd_price: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                      placeholder="Enter USD price"
                      disabled={uploading || actionLoading === "submit"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.usd_discount_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usd_discount_price: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                      placeholder="Enter USD discount"
                      disabled={uploading || actionLoading === "submit"}
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 Set USD prices manually for full control, or use the
                  exchange rate for auto-conversion
                </p>
              </div>

              {/* Media Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images/Videos
                </label>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-radiance-goldColor transition-colors">
                  <input
                    type="file"
                    id="media-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || actionLoading === "submit"}
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-radiance-goldColor">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                      Images (JPG, PNG, GIF, WEBP) or Videos (MP4, WEBM) - Max
                      5MB (images), 50MB (videos)
                    </p>
                  </label>
                </div>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Uploaded Media:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedImages.map((url, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                          {url.match(/\.(mp4|webm|mov)$/i) ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <FileVideo size={32} className="text-gray-400" />
                            </div>
                          ) : (
                            <img
                              src={url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedUrl(url)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            disabled={uploading || actionLoading === "submit"}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Pending Upload */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Files to upload ({selectedFiles.length}):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                        >
                          {file.type.startsWith("video/") ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileVideo size={32} className="text-gray-400" />
                            </div>
                          ) : (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] p-1 truncate">
                            {file.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            disabled={uploading || actionLoading === "submit"}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  disabled={uploading || actionLoading === "submit"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "submit" || uploading}
                  className="flex-1 px-6 py-3 bg-radiance-goldColor text-white rounded-xl font-medium hover:bg-radiance-charcoalTextColor transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : actionLoading === "submit" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
