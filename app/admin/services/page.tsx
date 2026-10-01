"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type Service = {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  image: "",
  isActive: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadServices = async () => {
    try {
        const response = await fetch("/api/admin/services");
      const data = await response.json();

      if (data.success) {
        setServices(data.services);
      }
    } catch {
      setMessage("Failed to load services");
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/services")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setServices(data.services);
        }
      })
      .catch(() => {
        if (isMounted) setMessage("Failed to load services");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const url = editingId
        ? `/api/services/${editingId}`
        : "/api/services";

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          duration: Number(form.duration),
          image: form.image,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      setMessage(
        editingId
          ? "Service updated successfully"
          : "Service created successfully"
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadServices();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service._id);

    setForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      image: service.image || "",
      isActive: service.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleStatus = async (service: Service) => {
    try {
      const response = await fetch(
        `/api/services/${service._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !service.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      await loadServices();
    } catch {
      setMessage("Failed to update service status");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Service deleted successfully");

      await loadServices();
    } catch {
      setMessage("Failed to delete service");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <AdminPageHeader
        title="Service Management"
        description="Add, update, activate, and manage your full salon treatment catalog, durations, and pricing."
        breadcrumbs={[{ label: "Services" }]}
      />

      {message && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs sm:text-sm text-stone-800 shadow-xs">
          {message}
        </div>
      )}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Service" : "Add Service"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Service Name
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Price
              </label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Duration (minutes)
              </label>

              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                min="1"
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Image URL
              </label>

              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div className="flex items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isActive: e.target.checked,
                  })
                }
              />

              <span>Service Active</span>
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button
                disabled={loading}
                className="rounded-lg bg-stone-900 px-6 py-3 text-white"
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Service"
                  : "Add Service"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border px-6 py-3"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-stone-100 text-left">
              <tr>
                <th className="p-4">Service</th>
                <th className="p-4">Price</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {services.map((service) => (
                <tr
                  key={service._id}
                  className="border-b last:border-none"
                >
                  <td className="p-4">
                    <p className="font-medium">{service.name}</p>

                    <p className="mt-1 max-w-sm text-sm text-stone-500">
                      {service.description}
                    </p>
                  </td>

                  <td className="p-4">
                    LKR {service.price.toLocaleString()}
                  </td>

                  <td className="p-4">
                    {service.duration} min
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        service.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {service.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleStatus(service)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        {service.isActive
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(service._id)
                        }
                        className="rounded-lg border px-3 py-2 text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {services.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-stone-500"
                  >
                    No services available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}