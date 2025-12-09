import { NextResponse } from "next/server";

// ---- SEED ROUTE ----
// This inserts initial bodybuilding show documents into the Meilisearch "shows" index.

export async function POST() {
  const shows = [
    {
      id: "arnold-2025",
      federation: "IFBB Pro",
      show_name: "Arnold Classic 2025",
      show_date: "2025-03-01",
      city: "Columbus",
      state: "OH",
      country: "USA",
      divisions: ["Men's Open", "Classic Physique", "212", "Bikini", "Wellness"],
      url: "https://www.arnoldsports.com",
      flyer_url: null,
      results_available: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "olympia-2025",
      federation: "IFBB Pro",
      show_name: "Mr. Olympia 2025",
      show_date: "2025-10-10",
      city: "Las Vegas",
      state: "NV",
      country: "USA",
      divisions: [
        "Men's Open",
        "Classic Physique",
        "212",
        "Men's Physique",
        "Figure",
        "Bikini",
        "Wellness"
      ],
      url: "https://mrolympia.com",
      flyer_url: null,
      results_available: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  try {
    const res = await fetch("YOUR-MEILISEARCH-HOST/indexes/shows/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR-WRITE-API-KEY`
      },
      body: JSON.stringify(shows)
    });

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ---- OPTIONAL:
