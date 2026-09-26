import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  // Redirect legacy /products/:slug URLs to /shop/products/:slug
  redirect(`/shop/products/${encodeURIComponent(slug)}`);
}
