import Link from "next/link";

type Service = {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  isActive: boolean;
};

async function getServices(): Promise<Service[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    const response = await fetch(`${baseUrl}/api/services`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.services || [];
  } catch (error) {
    console.error("Failed to load services:", error);
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-stone-900 px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-300">
            Our Services
          </p>

          <h1 className="text-4xl font-semibold md:text-5xl">
            Beauty & Salon Services
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-stone-300">
            Discover our professional salon services designed to help you
            look and feel your best.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {services.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900">
                No services available
              </h2>

              <p className="mt-2 text-stone-500">
                Please check again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="h-60 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-60 items-center justify-center bg-stone-200 text-stone-500">
                      No Image
                    </div>
                  )}

                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-stone-900">
                      {service.name}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-stone-500">Price</p>

                        <p className="font-semibold text-stone-900">
                          LKR {service.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-stone-500">Duration</p>

                        <p className="font-medium text-stone-900">
                          {service.duration} min
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/appointments?service=${service._id}`}
                      className="mt-6 block rounded-lg bg-stone-900 px-4 py-3 text-center font-medium text-white transition hover:bg-stone-800"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}