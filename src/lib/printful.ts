const PRINTFUL_API = "https://api.printful.com";

export interface PrintfulProduct {
  id: number;
  name: string;
  thumbnail_url: string;
  variants?: PrintfulVariant[];
}

export interface PrintfulVariant {
  id: number;
  name: string;
  retail_price: string;
  currency: string;
}

export async function getProducts(): Promise<PrintfulProduct[]> {
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_PRINTFUL_API_KEY") return [];

  try {
    const res = await fetch(`${PRINTFUL_API}/store/products`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.result || [];
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<PrintfulProduct | null> {
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_PRINTFUL_API_KEY") return null;

  try {
    const res = await fetch(`${PRINTFUL_API}/store/products/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch {
    return null;
  }
}
